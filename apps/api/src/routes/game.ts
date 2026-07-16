import { Router } from 'express';
import { startSession, completeLevel } from '../controllers/game.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { levelCompletionSchema } from '@learnquest/validation';

const router = Router();

router.use(authenticate);
router.use(authorize('Student', 'Super Administrator'));

router.post('/start-session', startSession);
router.post('/complete-level', validateRequest(levelCompletionSchema), completeLevel);

export default router;
