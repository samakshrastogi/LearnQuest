import { Router } from 'express';
import { getClasses, createAssignment, getClassReport } from '../controllers/teacher.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { createAssignmentSchema } from '@learnquest/validation';

const router = Router();

router.use(authenticate);

router.get('/classes', getClasses as any);
router.post('/assignments', createAssignment as any);
router.get('/classes/:classroomId/report', getClassReport as any);

export default router;
