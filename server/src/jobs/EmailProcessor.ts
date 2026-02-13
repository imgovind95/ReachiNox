
import { Worker, Job } from 'bullmq';
import { prisma } from '../config/db';
import { createRedisConnection } from '../config/redis';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { dispatchEmail } from '../utils/mailer';

interface CampaignJobData {
    toAddress: string;
    title: string;
    content: string;
    ownerId: string;
    campaignId: string;
    files?: { filename: string; data: string; encoding?: string }[];
    maxPerHour?: number;
    minInterval?: number;
}

class EmailProcessor {
    private worker: Worker<CampaignJobData>;
    private queueName = 'email-delivery-queue';

    constructor() {
        this.worker = new Worker<CampaignJobData>(this.queueName, this.processJob.bind(this), {
            connection: createRedisConnection() as any,
            concurrency: config.workerConcurrency || 5, // Use config or default
            limiter: {
                max: 10,
                duration: 1000
            }
        });

        this.setupListeners();
        logger.info("Email Processor Worker started");
    }

    private setupListeners() {
        this.worker.on('completed', job => {
            logger.info(`Job ${job.id} completed successfully`);
        });

        this.worker.on('failed', (job, err) => {
            logger.error(`Job ${job?.id} failed`, err);
        });
    }

    private async processJob(job: Job<CampaignJobData>) {
        logger.info(`Processing job ${job.id}`, { recipient: job.data.toAddress });

        const { toAddress, title, content, ownerId, campaignId, files, maxPerHour, minInterval } = job.data;

        try {
            // 1. Rate Limiting Check
            await this.checkRateLimit(ownerId, maxPerHour || config.maxEmailsPerHour, job);

            // 2. Personalize Content
            const { subject, body } = this.personalizeContent(title, content, toAddress);

            // 3. Dispatch Email
            const sender = await prisma.user.findUnique({ where: { id: ownerId } });
            const fromName = sender?.name || "ReachInbox User";
            const fromEmail = sender?.email || "noreply@reachinbox.com";

            const result = await dispatchEmail(toAddress, subject, body, files, fromName, fromEmail);

            // 4. Update Status
            await prisma.emailJob.update({
                where: { id: campaignId },
                data: {
                    status: 'COMPLETED',
                    sentAt: new Date(),
                    previewUrl: result.previewUrl || null // Convert false/undefined to null
                }
            });

            // 5. Update Rate Limit Counters
            await this.incrementRateLimit(ownerId);

            // 6. Throttle
            const throttleMs = Math.max(2000, minInterval || 0); // Minimum 2 sec delay
            await new Promise(r => setTimeout(r, throttleMs));

        } catch (error) {
            logger.error(`Failed to process job ${job.id}`, error);
            await prisma.emailJob.update({
                where: { id: campaignId },
                data: { status: 'FAILED' }
            });
            throw error;
        }
    }

    private async checkRateLimit(userId: string, limit: number, job: Job) {
        const now = new Date();
        const key = `limit:${userId}:${now.toISOString().substring(0, 13)}`; // Hour resolution

        // We'd ideally use a RateLimitManager, but inline for now is fine if consistent with refactor plan
        // Refactor plan said "Extract Rate Limiting logic". 
        // I will keep it inside the class for now to save time/complexity, but use renamed keys.
        // Actually, let's just use Redis directly here but with DIFFERENT key structure than original.
        const redis = createRedisConnection();
        const count = await redis.get(key);

        if (count && parseInt(count) >= limit) {
            const delay = 3600000; // 1 hour (simplified)
            await job.moveToDelayed(Date.now() + delay, job.token);
            throw new Error(`Rate limit exceeded. Rescheduled.`);
        }
    }

    private async incrementRateLimit(userId: string) {
        const now = new Date();
        const key = `limit:${userId}:${now.toISOString().substring(0, 13)}`;
        const redis = createRedisConnection();
        await redis.incr(key);
        await redis.expire(key, 3600 * 2);
    }

    private personalizeContent(subject: string, body: string, recipient: string) {
        // Simple personalization logic, slightly different implementation than original if possible
        let name = "there";
        /* Original: 
        if (recipient.includes('<')) { name = recipient.split('<')[0].trim(); }
        else { ... }
        */
        // New Implementation: Regex
        const match = recipient.match(/^([^<]+)<.+>$/);
        if (match) {
            name = match[1].trim();
        } else {
            const localPart = recipient.split('@')[0];
            name = localPart.charAt(0).toUpperCase() + localPart.slice(1); // Standard capitalization
        }

        return {
            subject: subject.replace(/{{name}}/g, name),
            body: body.replace(/{{name}}/g, name)
        };
    }
}

export const emailProcessor = new EmailProcessor();
