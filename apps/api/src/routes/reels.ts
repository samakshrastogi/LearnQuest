import { Router } from 'express';
import { getReelsFeed, likeReel, saveReel, submitReelQuiz } from '../controllers/reels.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('Student', 'Super Administrator'));

router.get('/feed', getReelsFeed);
router.post('/like', likeReel);
router.post('/save', saveReel);
router.post('/quiz/submit', submitReelQuiz);

export default router;
