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
router.use(authorize('Platform Administrator', 'Super Administrator'));

router.get('/analytics', getSystemAnalytics);
router.post('/teachers/approve', approveTeacher);

// Curriculum CMS routes
router.post('/curriculum/subjects', addCurriculumSubject);
router.post('/curriculum/chapters', addCurriculumChapter);
router.post('/curriculum/topics', addCurriculumTopic);
router.post('/curriculum/missions', addCurriculumMission);
router.post('/curriculum/questions', addCurriculumQuestion);
router.post('/curriculum/level-questions', addGameLevelQuestions);

export default router;
