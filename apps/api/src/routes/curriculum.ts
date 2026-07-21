import { Router } from 'express';
import { getSubjects, getChapters, getTopics, getAllTopics, getMissions, validateAnswer } from '../controllers/curriculum.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { answerSubmissionSchema } from '@learnquest/validation';

const router = Router();

// Public routes for exploration
router.get('/subjects', getSubjects as any);
router.get('/all-topics', getAllTopics as any);
router.get('/subjects/:subjectId/chapters', getChapters as any);
router.get('/chapters/:chapterId/topics', getTopics as any);
router.get('/topics/:topicId/missions', getMissions as any);

// Protected answer validations
router.post('/validate-answer', authenticate, validateRequest(answerSubmissionSchema), validateAnswer);

export default router;
