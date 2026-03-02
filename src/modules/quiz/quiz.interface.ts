import { Types } from "mongoose";

export type QuizStatus = "ongoing" | "completed" | "abandoned";

export interface IQuiz {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  category: Types.ObjectId;
  questions: Types.ObjectId[]; // Question ref গুলো
  status: QuizStatus;
  totalQuestions: number;
  attempt?: Types.ObjectId; // QuizAttempt ref — submit হলে add হবে
  createdAt?: Date;
  updatedAt?: Date;
}
