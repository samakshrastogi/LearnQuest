import { Router } from 'express';
import { createClan, joinClan, getClanDetails, getLeaderboard, getTournaments, postAnnouncement } from '../controllers/social.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { clanCreateSchema, clanJoinSchema } from '@learnquest/validation';

const router = Router();

// Public leaderboard
router.get('/leaderboard', getLeaderboard as any);
router.get('/tournaments', getTournaments as any);

// Protected clan interactions
router.get('/clan/my-clan', authenticate, getClanDetails as any);
router.post('/clan/create', authenticate, createClan as any);
router.post('/clan/join', authenticate, joinClan as any);
router.post('/clan/announcement', authenticate, postAnnouncement as any);

export default router;
