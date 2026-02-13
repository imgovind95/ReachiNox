
import { Router } from 'express';
import { campaignController } from '../controllers/campaignController';

const router = Router();

// Map routes to controller methods
router.post('/', campaignController.schedule);
router.get('/:userId', campaignController.listUserCampaigns);
router.get('/job/:id', campaignController.getDetails);

// Inbox route (simulated)
router.get('/inbox/:email', campaignController.getInbox);

export default router;
