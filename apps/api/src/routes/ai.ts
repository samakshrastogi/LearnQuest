import { Router, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { AIService } from '../services/ai.js';
import { StudentProfile } from '../models/Profiles.js';

const router = Router();

router.use(authenticate);
router.use(authorize('Student', 'Super Administrator'));

/**
 * 1. AI Tutor explains a wrong question
 */
router.post(
  '/tutor/explain',
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { questionId, selectedAnswer, language } = req.body;
      if (!questionId) {
        res.status(400).json({ success: false, message: 'Question ID is required' });
        return;
      }

      const student = await StudentProfile.findOne({ userId: req.user._id });
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found' });
        return;
      }

      const explanation = await AIService.explainWrongAnswer(
        student._id.toString() as string,
        questionId,
        selectedAnswer,
        student.classLevel,
        language || student.languagePreference
      );

      res.status(200).json({ success: true, data: { explanation } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 2. General student chat with Guruji
 */
router.post(
  '/tutor/ask',
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query, language } = req.body;
      if (!query) {
        res.status(400).json({ success: false, message: 'Query string is required' });
        return;
      }

      const student = await StudentProfile.findOne({ userId: req.user._id });
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found' });
        return;
      }

      const reply = await AIService.askTutor(
        student._id.toString() as string,
        query,
        student.classLevel,
        language || student.languagePreference
      );

      res.status(200).json({ success: true, data: { reply } });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
