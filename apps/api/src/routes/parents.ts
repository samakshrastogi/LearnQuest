import { Router } from 'express';
import { getChildren, getChildProgress, updateScreenTimeLimits } from '../controllers/parent.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/children', getChildren as any);
router.get('/children/:childId/progress', getChildProgress as any);
router.post('/limits', updateScreenTimeLimits as any);

export default router;
