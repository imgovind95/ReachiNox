
import { Request, Response, NextFunction } from 'express';
import { campaignService } from '../services/campaignService';
import { CreateCampaignSchema } from '../validators/campaignValidator';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export class CampaignController {

    public async schedule(req: Request, res: Response, next: NextFunction) {
        try {
            // Validation
            const validationResult = CreateCampaignSchema.safeParse(req.body);

            if (!validationResult.success) {
                // ZodError has .issues, some versions have .errors. Casting to any ensures we can read it.
                const issues = (validationResult.error as any).issues || (validationResult.error as any).errors;
                const msg = issues.map((e: any) => e.message).join(', ');
                throw new AppError(`Validation Error: ${msg}`, 400);
            }

            const result = await campaignService.createCampaign(validationResult.data);

            res.status(201).json({
                success: true,
                data: result,
                message: "Campaign successfully scheduled"
            });

        } catch (error) {
            next(error);
        }
    }

    public async listUserCampaigns(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.userId as string;
            if (!userId) throw new AppError("User ID is required", 400);

            const campaigns = await campaignService.getUserCampaigns(userId);
            res.json(campaigns);
        } catch (error) {
            next(error);
        }
    }

    public async getDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const details = await campaignService.getCampaignDetails(id);
            res.json(details);
        } catch (error) {
            next(error);
        }
    }
    public async getInbox(req: Request, res: Response, next: NextFunction) {
        try {
            const email = req.params.email as string;
            if (!email) throw new AppError("Email address is required", 400);

            const messages = await campaignService.getInboxMessages(email);
            res.json(messages);
        } catch (error) {
            next(error);
        }
    }
}

export const campaignController = new CampaignController();
