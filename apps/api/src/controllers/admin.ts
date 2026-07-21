import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { User } from '../models/User.js';
import { TeacherProfile, School, StudentProfile } from '../models/Profiles.js';
import { Subject, Chapter, Topic, Mission, GameLevel } from '../models/Curriculum.js';
import { Question } from '../models/Activity.js';
import { AuditLog } from '../models/Misc.js';
import mongoose from 'mongoose';

export const getSystemAnalytics = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userCount = await User.countDocuments();
    const studentCount = await StudentProfile.countDocuments();
    const teacherCount = await TeacherProfile.countDocuments();
    const schoolCount = await School.countDocuments();
    
    // Fetch last 10 audit logs
    const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(10);

    res.status(200).json({
      success: true,
      data: {
        counters: {
          totalUsers: userCount,
          students: studentCount,
          teachers: teacherCount,
          schools: schoolCount,
        },
        recentAuditLogs: logs,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveTeacher = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { teacherProfileId } = req.body;

    const teacher = await TeacherProfile.findById(teacherProfileId).session(session);
    if (!teacher) {
      res.status(404).json({ success: false, message: 'Teacher profile not found' });
      return;
    }

    teacher.isApproved = true;
    await teacher.save({ session });

    // Mark associated User verified
    await User.findByIdAndUpdate(teacher.userId, { isVerified: true }).session(session);

    // Audit log
    await new AuditLog({
      userId: req.user?._id,
      action: 'APPROVE_TEACHER',
      metadata: { teacherProfileId },
    }).save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Teacher approved successfully', data: teacher });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const addCurriculumSubject = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, code, icon, storyPrompt } = req.body;
    
    const subject = new Subject({ name, code, icon, storyPrompt });
    await subject.save();

    await new AuditLog({
      userId: req.user?._id,
      action: 'ADD_CURRICULUM_SUBJECT',
      metadata: { subjectId: subject._id, code },
    }).save();

    res.status(201).json({ success: true, message: 'Subject created', data: subject });
  } catch (error) {
    next(error);
  }
};
export const addCurriculumChapter = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subjectId, name, sequence, bannerUrl, description } = req.body;
    
    const chapter = new Chapter({ subjectId, name, sequence, bannerUrl, description });
    await chapter.save();

    res.status(201).json({ success: true, message: 'Chapter created', data: chapter });
  } catch (error) {
    next(error);
  }
};
export const addCurriculumTopic = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chapterId, subjectName, chapterName, name, sequence, description } = req.body;
    let targetChapterId = chapterId;

    if (!targetChapterId && (subjectName || chapterName)) {
      let sub = await Subject.findOne({ name: subjectName || 'General Science' });
      if (!sub) {
        sub = new Subject({ name: subjectName || 'General Science', code: (subjectName || 'general').toLowerCase().replace(/\s+/g, '_') });
        await sub.save();
      }

      let chap = await Chapter.findOne({ subjectId: sub._id, name: chapterName || 'Core Concepts' });
      if (!chap) {
        chap = new Chapter({ subjectId: sub._id, name: chapterName || 'Core Concepts', sequence: 1 });
        await chap.save();
      }
      targetChapterId = chap._id;
    }

    if (!targetChapterId) {
      let defaultSub = await Subject.findOne({});
      if (!defaultSub) {
        defaultSub = new Subject({ name: 'General Knowledge', code: 'gk' });
        await defaultSub.save();
      }
      let defaultChap = await Chapter.findOne({ subjectId: defaultSub._id });
      if (!defaultChap) {
        defaultChap = new Chapter({ subjectId: defaultSub._id, name: 'Foundation Topics', sequence: 1 });
        await defaultChap.save();
      }
      targetChapterId = defaultChap._id;
    }

    const topic = new Topic({ chapterId: targetChapterId, name, sequence: sequence || 1, description: description || '' });
    await topic.save();

    res.status(201).json({ success: true, message: 'Topic created successfully', data: topic });
  } catch (error) {
    next(error);
  }
};

export const deleteCurriculumTopic = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topicId } = req.params;
    await Topic.findByIdAndDelete(topicId);
    res.status(200).json({ success: true, message: 'Topic deleted successfully' });
  } catch (error) {
    next(error);
  }
};
export const addCurriculumMission = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { topicId, name, type, sequence, xpReward, coinReward, crystalReward, prerequisites } = req.body;
    
    const mission = new Mission({
      topicId,
      name,
      type,
      sequence,
      xpReward,
      coinReward,
      crystalReward,
      prerequisites,
    });
    await mission.save({ session });

    // Automatically provision a default GameLevel grid map for Phaser
    const level = new GameLevel({
      missionId: mission._id,
      sceneKey: 'PlatformerScene',
      mapData: {},
      enemyConfig: [],
    });
    await level.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, message: 'Mission and Level created', data: mission });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
export const addCurriculumQuestion = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topicId, type, difficulty, questionText, questionMedia, options, correctAnswer, explanation, hints, marks, timeLimitSeconds } = req.body;
    
    const question = new Question({
      topicId,
      type,
      difficulty,
      questionText,
      questionMedia,
      options,
      correctAnswer,
      explanation,
      hints,
      marks,
      timeLimitSeconds,
    });
    await question.save();

    res.status(201).json({ success: true, message: 'Question created', data: question });
  } catch (error) {
    next(error);
  }
};
export const addGameLevelQuestions = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { levelId, checkpointQuestions } = req.body; // Array of question IDs
    
    const level = await GameLevel.findByIdAndUpdate(
      levelId,
      { $addToSet: { checkpointQuestions: { $each: checkpointQuestions } } },
      { new: true }
    );

    res.status(200).json({ success: true, message: 'Questions bound to game level checkpoints', data: level });
  } catch (error) {
    next(error);
  }
};
