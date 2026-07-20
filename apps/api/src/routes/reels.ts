import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getReelsFeed, likeReel, dislikeReel, saveReel, submitReelQuiz, uploadReel } from '../controllers/reels.js';
import { authenticate } from '../middlewares/auth.js';

const localUploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, localUploadsDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

const router = Router();

router.use(authenticate);

router.get('/feed', getReelsFeed);
router.post('/like', likeReel);
router.post('/dislike', dislikeReel);
router.post('/save', saveReel);
router.post('/upload', upload.single('video'), uploadReel);
router.post('/quiz/submit', submitReelQuiz);

export default router;
