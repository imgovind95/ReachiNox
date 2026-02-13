import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env';
import { redisConnection } from './config/redis';
import campaignRouter from './api/campaigns';
import authEndpoints from './api/authentication';
import './jobs/EmailProcessor'; // Initialize Background Processor

const apiServer = express();

apiServer.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            config.clientUrl,
            'https://reachinbox-chi.vercel.app',
            'https://reach-inbox-task-sable.vercel.app',
            'http://localhost:3000',
            'http://localhost:3001',
            'https://reachi-9e87c38pc-govinds-projects-ef85b514.vercel.app',
            'https://reachi-nox.vercel.app'
        ];

        if (!origin || allowedOrigins.includes(origin) || /https:\/\/.*-govinds-projects-.*\.vercel\.app/.test(origin)) {
            callback(null, true);
        } else {
            console.warn(`Blocked by CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
apiServer.use(express.json({ limit: '50mb' }));
apiServer.use(express.urlencoded({ limit: '50mb', extended: true }));
apiServer.use(morgan('dev'));

// Route Registration
apiServer.use('/api/schedule', campaignRouter);
apiServer.use('/api/auth', authEndpoints);

apiServer.get('/health', (req, res) => {
    res.json({ status: 'active', redisState: redisConnection.status });
});

apiServer.listen(config.port, () => {
    console.log(`API Server initialized on port ${config.port}`);
    console.log(`Database connected: ${process.env.DATABASE_URL}`);
});
