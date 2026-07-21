import { Response, NextFunction } from 'express';
import { Subject, Chapter, Topic, Mission } from '../models/Curriculum.js';
import { Question, QuestionAttempt, StudentMastery } from '../models/Activity.js';
import { StudentProfile } from '../models/Profiles.js';
import { AIService } from '../services/ai.js';

export const getSubjects = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    let subjects = await Subject.find({ isActive: true });
    
    // Auto-generate using Gemini AI if empty
    if (subjects.length === 0) {
      const classLevel = req.user?.classLevel || 5;
      await AIService.generateCurriculumForClass(classLevel);
      subjects = await Subject.find({ isActive: true });
    }

    res.status(200).json({ success: true, message: 'Subjects fetched successfully', data: subjects });
  } catch (error) {
    next(error);
  }
};

export const getChapters = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subjectId } = req.params;
    let chapters = await Chapter.find({ subjectId }).sort({ sequence: 1 });

    // Auto-generate using Gemini AI if empty
    if (chapters.length === 0) {
      const classLevel = req.user?.classLevel || 5;
      await AIService.generateCurriculumForClass(classLevel);
      chapters = await Chapter.find({ subjectId }).sort({ sequence: 1 });
    }

    res.status(200).json({ success: true, message: 'Chapters fetched successfully', data: chapters });
  } catch (error) {
    next(error);
  }
};

export const getTopics = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chapterId } = req.params;
    let topics = await Topic.find({ chapterId }).sort({ sequence: 1 });

    // Auto-generate using Gemini AI if empty
    if (topics.length === 0) {
      const classLevel = req.user?.classLevel || 5;
      await AIService.generateCurriculumForClass(classLevel);
      topics = await Topic.find({ chapterId }).sort({ sequence: 1 });
    }

    res.status(200).json({ success: true, message: 'Topics fetched successfully', data: topics });
  } catch (error) {
    next(error);
  }
};

export const getAllTopics = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    let topics = await Topic.find({})
      .populate({
        path: 'chapterId',
        select: 'name sequence subjectId',
        populate: { path: 'subjectId', select: 'name code icon' },
      })
      .sort({ sequence: 1, createdAt: 1 });

    if (topics.length === 0) {
      const classLevel = req.user?.classLevel || 5;
      await AIService.generateCurriculumForClass(classLevel);
      topics = await Topic.find({})
        .populate({
          path: 'chapterId',
          select: 'name sequence subjectId',
          populate: { path: 'subjectId', select: 'name code icon' },
        })
        .sort({ sequence: 1, createdAt: 1 });
    }

    // Deduplicate/normalize sequences so every topic has a unique serial number (1, 2, 3, 4...)
    const seenSequences = new Set<number>();
    let hasDuplicates = false;

    for (const t of topics) {
      if (seenSequences.has(t.sequence) || !t.sequence) {
        hasDuplicates = true;
        break;
      }
      seenSequences.add(t.sequence);
    }

    if (hasDuplicates) {
      for (let i = 0; i < topics.length; i++) {
        const serialNum = i + 1;
        topics[i].sequence = serialNum;
        await Topic.findByIdAndUpdate(topics[i]._id, { sequence: serialNum });
      }
      topics = await Topic.find({})
        .populate({
          path: 'chapterId',
          select: 'name sequence subjectId',
          populate: { path: 'subjectId', select: 'name code icon' },
        })
        .sort({ sequence: 1 });
    }

    res.status(200).json({ success: true, message: 'All topics fetched successfully', data: topics });
  } catch (error) {
    next(error);
  }
};

export const getMissions = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { topicId } = req.params;
    const missions = await Mission.find({ topicId }).sort({ sequence: 1 });
    res.status(200).json({ success: true, message: 'Missions fetched successfully', data: missions });
  } catch (error) {
    next(error);
  }
};

/**
 * Backend-only grading engine. Prevents cheating by verifying submitted answers without displaying answers beforehand.
 */
export const validateAnswer = async (
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

    const { questionId, answer, timeTakenSeconds, hintCountUsed } = req.body;
    const student = await StudentProfile.findOne({ userId: user._id });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found', code: 'NOT_FOUND' });
      return;
    }

    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({ success: false, message: 'Question not found', code: 'NOT_FOUND' });
      return;
    }

    // Evaluate answer depending on question type
    let isCorrect = false;
    const cleanAnswer = typeof answer === 'string' ? answer.trim().toLowerCase() : answer;
    const cleanCorrect = typeof question.correctAnswer === 'string' ? question.correctAnswer.trim().toLowerCase() : question.correctAnswer;

    if (question.type === 'mcq' || question.type === 'fitb' || question.type === 'short') {
      isCorrect = cleanAnswer == cleanCorrect;
    } else if (question.type === 'multi-select' && Array.isArray(answer) && Array.isArray(question.correctAnswer)) {
      const sortedAnswer = [...answer].map(a => String(a).toLowerCase()).sort();
      const sortedCorrect = [...question.correctAnswer].map(c => String(c).toLowerCase()).sort();
      isCorrect = JSON.stringify(sortedAnswer) === JSON.stringify(sortedCorrect);
    } else if (question.type === 'ordering' && Array.isArray(answer) && Array.isArray(question.correctAnswer)) {
      isCorrect = JSON.stringify(answer) === JSON.stringify(question.correctAnswer);
    } else {
      isCorrect = cleanAnswer == cleanCorrect;
    }

    // Save individual QuestionAttempt record
    const attempt = new QuestionAttempt({
      studentId: student._id,
      questionId,
      isCorrect,
      selectedAnswer: answer,
      timeTakenSeconds: timeTakenSeconds || 0,
      hintCountUsed: hintCountUsed || 0,
    });
    await attempt.save();

    // Update Adaptive Learning StudentMastery metrics
    let mastery = await StudentMastery.findOne({ studentId: student._id, topicId: question.topicId });
    if (!mastery) {
      mastery = new StudentMastery({
        studentId: student._id,
        topicId: question.topicId,
        masteryScore: 0,
        attemptsCount: 0,
        correctAttemptsCount: 0,
      });
    }

    mastery.attemptsCount += 1;
    if (isCorrect) {
      mastery.correctAttemptsCount += 1;
    }

    // Recalculate topic mastery score (rolling accuracy scaled for difficulty)
    const accuracy = (mastery.correctAttemptsCount / mastery.attemptsCount) * 100;
    
    // Adaptive modifier based on hint usage and timing
    let modifier = 1.0;
    if ((hintCountUsed || 0) > 0) modifier -= 0.1 * hintCountUsed;
    if ((timeTakenSeconds || 0) > 40) modifier -= 0.05;
    
    mastery.masteryScore = Math.max(0, Math.min(100, Math.round(accuracy * modifier)));
    mastery.weakTopicFlag = mastery.attemptsCount >= 3 && mastery.masteryScore < 60;
    mastery.lastAttemptedAt = new Date();
    await mastery.save();

    res.status(200).json({
      success: true,
      message: 'Answer validated successfully',
      data: {
        isCorrect,
        explanation: question.explanation,
        marksGained: isCorrect ? question.marks : 0,
        newMasteryScore: mastery.masteryScore,
        weakTopicFlag: mastery.weakTopicFlag,
      },
    });
  } catch (error) {
    next(error);
  }
};
