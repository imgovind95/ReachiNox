import { Router } from 'express';
import { prisma } from '../config/db';

const router = Router();

router.post('/google', async (req, res) => {
    // Receive tokens from frontend or code to exchange
    const { email, name, avatar, googleId } = req.body;

    if (!email || !googleId) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        // Construct update data dynamically to avoid overwriting with empty values
        const updateData: any = { googleId };
        if (name) updateData.name = name;
        if (avatar) updateData.avatar = avatar;

        // Upsert user
        const user = await prisma.user.upsert({
            where: { email },
            update: updateData,
            create: {
                email,
                name: name || email.split('@')[0], // Fallback name for creation
                avatar,
                googleId
            }
        });

        res.json({ user });
    } catch (error: any) {
        console.error("Auth Error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            details: error.message,
            code: error.code // Prisma error code
        });
    }
});

router.post('/unlink', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
    }

    try {
        // Update user to remove googleId and avatar
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                googleId: null,
                avatar: null
            }
        });

        res.json({ success: true, message: "Unlinked Google Account", user });
    } catch (error: any) {
        console.error("Unlink Error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            details: error.message
        });
    }
});

export default router;
