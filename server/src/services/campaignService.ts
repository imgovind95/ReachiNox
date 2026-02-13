
import { prisma } from '../config/db';
import { queueService } from './queueService';
import { CampaignInput } from '../validators/campaignValidator';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';

export class CampaignService {

    public async createCampaign(input: CampaignInput) {
        logger.info("Initiating campaign creation", { user: input.ownerId });

        // 1. Calculate Schedule Delay
        let scheduleDelay = 0;
        let targetTime = new Date();

        if (input.scheduleTime) {
            targetTime = new Date(input.scheduleTime);
            const now = new Date();
            scheduleDelay = Math.max(0, targetTime.getTime() - now.getTime());
        }

        // 2. Persist Task to Database
        const campaignTask = await prisma.emailJob.create({
            data: {
                userId: input.ownerId,
                recipient: input.toAddress,
                subject: input.title,
                body: input.content,
                // If delay is 0, we mark as COMPLETED immediately strictly for the DB record logic
                // But in reality, the worker will define the final status. 
                // We'll stick to PENDING for consistency with new flow, or match old logic if needed.
                // Old logic: status: executionDelay === 0 ? 'COMPLETED' : 'PENDING'
                status: scheduleDelay === 0 ? 'COMPLETED' : 'PENDING',
                sentAt: scheduleDelay === 0 ? new Date() : undefined,
                scheduledAt: targetTime,
                attachments: input.files ? JSON.parse(JSON.stringify(input.files)) : undefined
            }
        });

        logger.info(`Campaign task created with ID: ${campaignTask.id}`);

        // 3. Dispatch to Queue
        try {
            const jobId = await queueService.scheduleEmail({
                toAddress: input.toAddress,
                title: input.title,
                content: input.content,
                ownerId: input.ownerId,
                campaignId: campaignTask.id,
                files: input.files,
                maxPerHour: input.maxPerHour,
                minInterval: input.minInterval
            }, scheduleDelay);

            // 4. Link Queue Job ID
            await prisma.emailJob.update({
                where: { id: campaignTask.id },
                data: { jobId: jobId }
            });

            return {
                taskId: campaignTask.id,
                queueId: jobId,
                status: 'SCHEDULED'
            };

        } catch (error) {
            logger.error("Failed to enqueue campaign", error);
            throw new AppError("Failed to schedule campaign", 500);
        }
    }

    public async getUserCampaigns(userId: string) {
        return prisma.emailJob.findMany({
            where: { userId },
            orderBy: { scheduledAt: 'desc' }
        });
    }

    public async getCampaignDetails(taskId: string) {
        const task = await prisma.emailJob.findUnique({
            where: { id: taskId },
            include: { user: { select: { name: true, email: true, avatar: true } } }
        });

        if (!task) throw new AppError("Campaign task not found", 404);
        return task;
    }

    public async getInboxMessages(email: string) {
        return prisma.emailJob.findMany({
            where: {
                recipient: { equals: email, mode: 'insensitive' },
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
    }
}

export const campaignService = new CampaignService();
