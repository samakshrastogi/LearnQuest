import { Response, NextFunction } from 'express';
import { Reel, ReelInteraction } from '../models/Misc.js';
import { Question, QuestionAttempt, StudentMastery } from '../models/Activity.js';
import { StudentProfile } from '../models/Profiles.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { WalletService } from '../services/wallet.js';
import mongoose from 'mongoose';

export const getReelsFeed = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const student = await StudentProfile.findOne({ userId: user._id });
    const { subjectId, chapterId, topicId, classLevel } = req.query;

    const queryFilter: any = { isVerified: true };
    if (subjectId) queryFilter.subjectId = subjectId;
    if (chapterId) queryFilter.chapterId = chapterId;
    if (topicId) queryFilter.topicId = topicId;
    if (classLevel) {
      queryFilter.classLevel = parseInt(String(classLevel), 10);
    } else if (student) {
      queryFilter.classLevel = student.classLevel;
    }

    let reels = await Reel.find(queryFilter)
      .populate('subjectId', 'name code icon')
      .populate('chapterId', 'name sequence')
      .populate('quizQuestions')
      .limit(20);

    // Fallback: If filter returns no reels, retrieve all verified reels so feed is never blank
    if (reels.length === 0) {
      reels = await Reel.find({ isVerified: true })
        .populate('subjectId', 'name code icon')
        .populate('chapterId', 'name sequence')
        .populate('quizQuestions')
        .limit(20);
    }

    // Get user interactions for these reels
    const reelIds = reels.map((r) => r._id);
    const interactions = student
      ? await ReelInteraction.find({
          studentId: student._id,
          reelId: { $in: reelIds },
        })
      : [];

    const interactionsMap = new Map();
    for (const inter of interactions) {
      interactionsMap.set(inter.reelId.toString(), {
        liked: inter.liked,
        disliked: inter.disliked,
        saved: inter.saved,
        quizCompleted: inter.quizCompleted,
      });
    }

    const feed = reels.map((reel) => {
      const inter = interactionsMap.get(reel._id.toString()) || {
        liked: false,
        disliked: false,
        saved: false,
        quizCompleted: false,
      };
      return {
        ...reel.toObject(),
        userInteraction: inter,
      };
    });

    res.status(200).json({ success: true, message: 'Reels feed fetched successfully', data: feed });
  } catch (error) {
    next(error);
  }
};

export const dislikeReel = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const { reelId } = req.body;

    const student = await StudentProfile.findOne({ userId: user?._id });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    let interaction = await ReelInteraction.findOne({ studentId: student._id, reelId });
    if (!interaction) {
      interaction = new ReelInteraction({ studentId: student._id, reelId });
    }

    const previouslyDisliked = interaction.disliked;
    interaction.disliked = !previouslyDisliked;

    if (interaction.disliked && interaction.liked) {
      interaction.liked = false;
      await Reel.findByIdAndUpdate(reelId, { $inc: { likesCount: -1 } });
    }

    await interaction.save();

    await Reel.findByIdAndUpdate(reelId, {
      $inc: { dislikesCount: interaction.disliked ? 1 : -1 },
    });

    res.status(200).json({
      success: true,
      message: interaction.disliked ? 'Reel disliked' : 'Reel dislike removed',
      data: { disliked: interaction.disliked },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadReel = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const { title, description, subjectId, chapterId, topicId, classLevel, language, videoUrl } = req.body;
    let finalVideoUrl = videoUrl;

    if (req.file) {
      finalVideoUrl = `/uploads/${req.file.filename}`;
    }

    if (!finalVideoUrl || !title || !subjectId || !chapterId) {
      res.status(400).json({ success: false, message: 'Video file/URL, title, subject, and chapter are required' });
      return;
    }

    const newReel = new Reel({
      title,
      description: description || '',
      videoUrl: finalVideoUrl,
      subjectId,
      chapterId,
      topicId: topicId || undefined,
      classLevel: classLevel ? parseInt(String(classLevel), 10) : 5,
      language: language || 'en',
      teacherId: user.role === 'Teacher' ? user._id : undefined,
      isVerified: true,
    });

    await newReel.save();

    res.status(201).json({
      success: true,
      message: 'Video reel uploaded successfully',
      data: newReel,
    });
  } catch (error) {
    next(error);
  }
};

export const likeReel = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const { reelId } = req.body;

    const student = await StudentProfile.findOne({ userId: user?._id });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    let interaction = await ReelInteraction.findOne({ studentId: student._id, reelId });
    if (!interaction) {
      interaction = new ReelInteraction({ studentId: student._id, reelId });
    }

    const previouslyLiked = interaction.liked;
    interaction.liked = !previouslyLiked;
    await interaction.save();

    // Update count in reel doc
    await Reel.findByIdAndUpdate(reelId, {
      $inc: { likesCount: interaction.liked ? 1 : -1 },
    });

    res.status(200).json({
      success: true,
      message: interaction.liked ? 'Reel liked' : 'Reel unliked',
      data: { liked: interaction.liked },
    });
  } catch (error) {
    next(error);
  }
};

export const saveReel = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const { reelId } = req.body;

    const student = await StudentProfile.findOne({ userId: user?._id });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    let interaction = await ReelInteraction.findOne({ studentId: student._id, reelId });
    if (!interaction) {
      interaction = new ReelInteraction({ studentId: student._id, reelId });
    }

    interaction.saved = !interaction.saved;
    await interaction.save();

    res.status(200).json({
      success: true,
      message: interaction.saved ? 'Reel saved to library' : 'Reel removed from library',
      data: { saved: interaction.saved },
    });
  } catch (error) {
    next(error);
  }
};

export const submitReelQuiz = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = req.user;
    const { reelId, answers } = req.body; // Array of { questionId, selectedAnswer }

    const student = await StudentProfile.findOne({ userId: user?._id }).session(session);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found' });
      return;
    }

    const reel = await Reel.findById(reelId).session(session);
    if (!reel) {
      res.status(404).json({ success: false, message: 'Reel not found' });
      return;
    }

    let interaction = await ReelInteraction.findOne({ studentId: student._id, reelId }).session(session);
    if (!interaction) {
      interaction = new ReelInteraction({ studentId: student._id, reelId });
    }

    if (interaction.quizCompleted) {
      res.status(400).json({ success: false, message: 'Quiz already completed for this reel' });
      return;
    }

    let correctCount = 0;
    for (const ans of answers) {
      const q = await Question.findById(ans.questionId).session(session);
      if (!q) continue;

      const isCorrect = String(ans.selectedAnswer).toLowerCase() === String(q.correctAnswer).toLowerCase();
      if (isCorrect) correctCount++;

      // Log question attempt
      const attempt = new QuestionAttempt({
        studentId: student._id,
        questionId: q._id,
        isCorrect,
        selectedAnswer: ans.selectedAnswer,
      });
      await attempt.save({ session });

      // Update Adaptive Learning StudentMastery metrics
      let mastery = await StudentMastery.findOne({ studentId: student._id, topicId: q.topicId }).session(session);
      if (!mastery) {
        mastery = new StudentMastery({
          studentId: student._id,
          topicId: q.topicId,
          masteryScore: 0,
          attemptsCount: 0,
          correctAttemptsCount: 0,
        });
      }
      mastery.attemptsCount += 1;
      if (isCorrect) mastery.correctAttemptsCount += 1;
      mastery.masteryScore = Math.round((mastery.correctAttemptsCount / mastery.attemptsCount) * 100);
      mastery.lastAttemptedAt = new Date();
      await mastery.save({ session });
    }

    const score = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
    
    // Save quiz completion on interaction
    interaction.quizCompleted = true;
    interaction.quizScore = score;
    await interaction.save({ session });

    // Reward for completing reel quiz: 5 coins and 10 XP
    let coinsEarned = score >= 50 ? 5 : 1;
    let xpEarned = score >= 50 ? 10 : 2;

    const walletResult = await WalletService.adjustBalance(
      student._id,
      'coins',
      coinsEarned,
      'quest_completion',
      interaction._id,
      session
    );
    await WalletService.adjustBalance(
      student._id,
      'xp',
      xpEarned,
      'quest_completion',
      interaction._id,
      session
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Reel quiz completed successfully',
      data: {
        score,
        correctCount,
        totalQuestions: answers.length,
        rewards: {
          coins: coinsEarned,
          xp: xpEarned,
        },
        wallet: walletResult,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
