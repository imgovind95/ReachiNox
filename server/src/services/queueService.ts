
import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { logger } from '../utils/logger';

// Interface for job data matching the new schema
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

class QueueManager {
    private queue: Queue<CampaignJobData>;

    constructor() {
        this.queue = new Queue<CampaignJobData>('email-delivery-queue', {
            connection: createRedisConnection() as any
        });
        logger.info("Email Delivery Queue initialized");
    }

    public async scheduleEmail(jobData: CampaignJobData, delay: number): Promise<string> {
        const job = await this.queue.add('process-email', jobData as any, {
            delay,
            jobId: jobData.campaignId // Deduplication ID
        });

        logger.info(`Scheduled job ${job.id} with delay ${delay}ms`);
        return job.id!;
    }
}

export const queueService = new QueueManager();
