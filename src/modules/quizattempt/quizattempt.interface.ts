import { Types } from "mongoose";

export interface IAnsweredQuestion {
  question: Types.ObjectId;
  questionText: string;
  options: string[];
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  wordRef?: Types.ObjectId;
}

export interface IQuizAttempt {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  quiz: Types.ObjectId; // Quiz ref — নতুন
  answeredQuestions: IAnsweredQuestion[];
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: Date;
}
