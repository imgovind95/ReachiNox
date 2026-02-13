import { Router, Request, Response } from 'express';
import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { prisma } from '../config/db';
import { z } from 'zod';
import { EmailJobData, ScheduleEmailRequest, ScheduleEmailResponse } from '../types';

const campaignRouter = Router();
const campaignQueue = new Queue<EmailJobData>('email-queue', { connection: redisConnection as any });

const emailPayloadSchema = z.object({
    recipient: z.string().email(),
    subject: z.string(),
    body: z.string(),
    userId: z.string().uuid(),
    scheduledAt: z.string().optional(),
    hourlyLimit: z.number().optional(),
    minDelay: z.number().optional(),
    attachments: z.array(z.object({
        filename: z.string(),
        content: z.string(), // Base64
        encoding: z.string().optional(),
    })).optional()
});

campaignRouter.post('/', async (req: Request<{}, {}, ScheduleEmailRequest>, res: Response<ScheduleEmailResponse | { error: string, details?: any }>) => {
    try {
        const payload = emailPayloadSchema.parse(req.body);
        const { recipient, subject, body, userId, scheduledAt, hourlyLimit, minDelay, attachments } = payload;

        // Calculate execution delay
        let executionDelay = 0;
        let targetDate = new Date();
        if (scheduledAt) {
            targetDate = new Date(scheduledAt);
            const currentTime = new Date();
            executionDelay = Math.max(0, targetDate.getTime() - currentTime.getTime());
        }

        // Persist Job Record
        const jobEntry = await prisma.emailJob.create({
            data: {
                userId,
                recipient,
                subject,
                body,
                status: executionDelay === 0 ? 'COMPLETED' : 'PENDING',
                sentAt: executionDelay === 0 ? new Date() : undefined,
                scheduledAt: targetDate,
                attachments: attachments ? JSON.parse(JSON.stringify(attachments)) : undefined
            }
        });

        // Enqueue Job
        const queueMetadata: EmailJobData = {
            recipient,
            subject,
            body,
            userId,
            hourlyLimit,
            minDelay,
            emailJobId: jobEntry.id,
            attachments
        };

        const queuedJob = await campaignQueue.add('dispatch-email', queueMetadata, {
            delay: executionDelay,
            jobId: jobEntry.id
        });

        // Link Queue ID
        await prisma.emailJob.update({
            where: { id: jobEntry.id },
            data: { jobId: queuedJob.id }
        });

        res.json({ success: true, jobId: queuedJob.id || jobEntry.id, message: 'Campaign scheduled successfully' });
    } catch (err: any) {
        console.error("Campaign Scheduling Failed:", err);
        if (err instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid Payload', details: (err as any).issues });
        } else {
            const errorMessage = err instanceof Error ? err.message : String(err);
            res.status(500).json({ error: 'System Error', details: errorMessage });
        }
    }
});

// Simulated Inbox (For Testing) - MOVED UP
campaignRouter.get('/inbox/:emailAddress', async (req, res) => {
    const { emailAddress } = req.params;
    if (!emailAddress) return res.status(400).json({ error: "Email address required" });

    try {
        const inboxMessages = await prisma.emailJob.findMany({
            where: {
                recipient: { equals: emailAddress, mode: 'insensitive' },
                OR: [
                    { status: 'COMPLETED' },
                    {
                        status: { in: ['PENDING', 'DELAYED'] },
                        scheduledAt: { lte: new Date() }
                    }
                ]
            },
            include: {
                user: {
                    select: { name: true, email: true, avatar: true }
                }
            },
            orderBy: { sentAt: 'desc' }
        });
        res.json(inboxMessages);
    } catch (err) {
        console.error("Inbox Retrieval Failed:", err);
        res.status(500).json({ error: "Could not retrieve inbox" });
    }
});

// Get Campaign Details - MOVED UP
campaignRouter.get('/job/:jobId', async (req, res) => {
    const { jobId } = req.params;
    try {
        const campaignDetails = await prisma.emailJob.findUnique({
            where: { id: jobId },
            include: {
                user: {
                    select: { name: true, email: true, avatar: true }
                }
            }
        });
        if (!campaignDetails) return res.status(404).json({ error: "Campaign not found" });
        res.json(campaignDetails);
    } catch (err) {
        console.error("Campaign Details Error:", err);
        res.status(500).json({ error: "Could not fetch campaign details" });
    }
});

// Retrieve User Campaigns (Generic Parameter Route - MOVED DOWN)
campaignRouter.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    console.log(`[DEBUG] Fetching campaigns for userId: ${userId}`);

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        // Validation: Verify if user exists first (Optional but good for debugging)
        // const userExists = await prisma.user.findUnique({ where: { id: userId } });
        // if (!userExists) return res.status(404).json({ error: "User not found" });

        console.log(`[DEBUG] Executing Prisma Query for ${userId}...`);
        const userCampaigns = await prisma.emailJob.findMany({
            where: { userId },
            orderBy: { scheduledAt: 'desc' }
        });
        console.log(`[DEBUG] Found ${userCampaigns.length} campaigns.`);
        res.json(userCampaigns);
    } catch (err: any) {
        console.error("[CRITICAL] Fetch Campaigns Error:", err);

        // Return 200 with empty array if it's a "User not found" foreign key error to prevent frontend crash
        if (err.code === 'P2025' || err.message?.includes('Foreign key constraint failed')) {
            console.warn("[WARN] User not found or FK constraint failed. Returning empty list.");
            return res.json([]);
        }

        res.status(500).json({
            error: "Failed to fetch campaigns",
            details: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined
        });
    }
});

export default campaignRouter;
