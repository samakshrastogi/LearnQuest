import { Router } from 'express';
import { startSession, completeLevel } from '../controllers/game.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { levelCompletionSchema } from '@learnquest/validation';

const router = Router();

router.use(authenticate);

router.post('/start-session', startSession as any);
router.post('/complete-level', completeLevel as any);

export default router;
