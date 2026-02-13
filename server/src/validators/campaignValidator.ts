import { z } from 'zod';

export const CreateCampaignSchema = z.object({
    toAddress: z.string().email({ message: "Invalid email address" }),
    title: z.string().min(1, "Subject is required"),
    content: z.string().min(1, "Body content is required"),
    ownerId: z.string().uuid("Invalid User ID"),
    scheduleTime: z.string().optional(),
    maxPerHour: z.number().positive().optional(),
    minInterval: z.number().nonnegative().optional(),
    files: z.array(z.object({
        filename: z.string(),
        data: z.string(),
        encoding: z.string().optional()
    })).optional()
});

export type CampaignInput = z.infer<typeof CreateCampaignSchema>;
