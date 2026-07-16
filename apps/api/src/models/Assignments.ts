import mongoose, { Schema, Document } from 'mongoose';

// 1. Assignment Schema
export interface IAssignment extends Document {
  classRoomId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  subjectId: mongoose.Types.ObjectId;
  dueDate: Date;
  type: 'mission' | 'quiz' | 'worksheet';
  referenceId: string; // MissionId, QuizId (ReelId or test ID), or Worksheet S3 URL
  maxScore: number;
  status: 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    classRoomId: { type: Schema.Types.ObjectId, ref: 'ClassRoom', required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'TeacherProfile', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    dueDate: { type: Date, required: true, index: true },
    type: { type: String, required: true, enum: ['mission', 'quiz', 'worksheet'] },
    referenceId: { type: String, required: true },
    maxScore: { type: Number, default: 100 },
    status: { type: String, required: true, enum: ['active', 'closed'], default: 'active' },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);

// 2. Assignment Submission Schema
export interface IAssignmentSubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: 'submitted' | 'graded';
  submissionData: any; // Marks/Answers configuration or worksheet file S3 URL
  score?: number;
  teacherFeedback?: string;
  submittedAt: Date;
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    status: { type: String, required: true, enum: ['submitted', 'graded'], default: 'submitted' },
    submissionData: { type: Schema.Types.Mixed, required: true },
    score: Number,
    teacherFeedback: String,
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const AssignmentSubmission = mongoose.model<IAssignmentSubmission>('AssignmentSubmission', AssignmentSubmissionSchema);
