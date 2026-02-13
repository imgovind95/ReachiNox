
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error("Please provide an email address");
        process.exit(1);
    }

    console.log(`Creating test inbox message for: ${email}`);

    // Create a dummy user to be the sender
    let sender = await prisma.user.findFirst();
    if (!sender) {
        sender = await prisma.user.create({
            data: {
                email: 'test-sender@example.com',
                name: 'Test Sender',
                googleId: 'test-sender-id',
                avatar: 'https://via.placeholder.com/150'
            }
        });
    }

    const job = await prisma.emailJob.create({
        data: {
            userId: sender.id,
            recipient: email,
            subject: "Test Inbox Message",
            body: "This is a simulated message to test the Inbox visibility.",
            status: "COMPLETED",
            sentAt: new Date(),
            scheduledAt: new Date()
        }
    });

    console.log(`Created EmailJob ${job.id} for recipient ${email}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
