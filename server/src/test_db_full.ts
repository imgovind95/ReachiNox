import { prisma } from './config/db';
import { redisConnection } from './config/redis';

async function test() {
    console.log("🚀 Starting System Check...");

    // 1. Test Redis
    try {
        console.log("Checking Redis...");
        const ping = await redisConnection.ping();
        console.log("✅ Redis PING:", ping);
    } catch (e) {
        console.error("❌ Redis Failed:", e);
    }

    // 2. Test User Upsert (Auth)
    try {
        console.log("Checking Prisma User Upsert...");
        const user = await prisma.user.upsert({
            where: { email: 'test_sys_check@example.com' },
            create: {
                email: 'test_sys_check@example.com',
                name: 'Test Sys',
                googleId: 'test_sys_123'
            },
            update: { name: 'Test Sys Updated' }
        });
        console.log("✅ User Upsert Success:", user.id);
    } catch (e) {
        console.error("❌ Prisma User Upsert Failed:", e);
    }

    // 3. Test EmailJob Query (Inbox)
    try {
        console.log("Checking Prisma EmailJob Query...");
        const jobs = await prisma.emailJob.findMany({
            take: 1
        });
        console.log("✅ EmailJob Query Success, found:", jobs.length);
    } catch (e) {
        console.error("❌ Prisma EmailJob Query Failed:", e);
    }

    process.exit(0);
}

test();
