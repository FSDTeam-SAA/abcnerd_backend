import { Types } from "mongoose";

export interface IAnsweredQuestion {
  question: Types.ObjectId;
  selectedOption: Types.ObjectId;
  isCorrect: boolean;
}

export interface IQuizAttempt {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  quiz: Types.ObjectId;
  answeredQuestions: IAnsweredQuestion[];
  score: number;
  totalQuestions: number;
  completedAt: Date;
}
