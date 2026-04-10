import { Types } from "mongoose";

export type QuizStatus = "ongoing" | "completed" | "abandoned";

export interface IQuiz {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  category: Types.ObjectId;
  questions: Types.ObjectId[]; // Question references
  status: QuizStatus;
  totalQuestions: number;
  attempt?: Types.ObjectId; // QuizAttempt reference — added after submit
  createdAt?: Date;
  updatedAt?: Date;
}
