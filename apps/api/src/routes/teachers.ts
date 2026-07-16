import { Router } from 'express';
import { getClasses, createAssignment, getClassReport } from '../controllers/teacher.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { createAssignmentSchema } from '@learnquest/validation';

const router = Router();

router.use(authenticate);
router.use(authorize('Teacher', 'Super Administrator'));

router.get('/classes', getClasses);
router.post('/assignments', validateRequest(createAssignmentSchema), createAssignment);
router.get('/classes/:classroomId/report', getClassReport);

export default router;
