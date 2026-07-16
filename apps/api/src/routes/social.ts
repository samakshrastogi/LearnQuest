import { Router } from 'express';
import { createClan, joinClan, getClanDetails, getLeaderboard, getTournaments, postAnnouncement } from '../controllers/social.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { clanCreateSchema, clanJoinSchema } from '@learnquest/validation';

const router = Router();

// Public leaderboard
router.get('/leaderboard', getLeaderboard);
router.get('/tournaments', getTournaments);

// Protected clan interactions
router.get('/clan/my-clan', authenticate, getClanDetails);
router.post('/clan/create', authenticate, validateRequest(clanCreateSchema), createClan);
router.post('/clan/join', authenticate, validateRequest(clanJoinSchema), joinClan);
router.post('/clan/announcement', authenticate, postAnnouncement);

export default router;
