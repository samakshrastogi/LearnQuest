import { Router } from 'express';
import { getSubjects, getChapters, getTopics, getMissions, validateAnswer } from '../controllers/curriculum.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { answerSubmissionSchema } from '@learnquest/validation';

const router = Router();

// Public routes for exploration
router.get('/subjects', getSubjects);
router.get('/subjects/:subjectId/chapters', getChapters);
router.get('/chapters/:chapterId/topics', getTopics);
router.get('/topics/:topicId/missions', getMissions);

// Protected answer validations
router.post('/validate-answer', authenticate, validateRequest(answerSubmissionSchema), validateAnswer);

export default router;
