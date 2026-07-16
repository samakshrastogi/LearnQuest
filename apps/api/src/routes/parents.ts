import { Router } from 'express';
import { getChildren, getChildProgress, updateScreenTimeLimits } from '../controllers/parent.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('Parent', 'Super Administrator'));

router.get('/children', getChildren);
router.get('/children/:childId/progress', getChildProgress);
router.post('/limits', updateScreenTimeLimits);

export default router;
