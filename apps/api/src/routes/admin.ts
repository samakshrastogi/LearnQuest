import { Router } from 'express';
import {
  getSystemAnalytics,
  approveTeacher,
  addCurriculumSubject,
  addCurriculumChapter,
  addCurriculumTopic,
  addCurriculumMission,
  addCurriculumQuestion,
  addGameLevelQuestions,
} from '../controllers/admin.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/analytics', getSystemAnalytics as any);
router.post('/teachers/approve', approveTeacher as any);

// Curriculum CMS routes
router.post('/curriculum/subjects', addCurriculumSubject as any);
router.post('/curriculum/chapters', addCurriculumChapter as any);
router.post('/curriculum/topics', addCurriculumTopic as any);
router.post('/curriculum/missions', addCurriculumMission as any);
router.post('/curriculum/questions', addCurriculumQuestion as any);
router.post('/curriculum/level-questions', addGameLevelQuestions as any);

export default router;
