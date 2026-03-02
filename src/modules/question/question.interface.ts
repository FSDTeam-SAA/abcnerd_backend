import { Types } from "mongoose";

export interface IQuestion {
  _id: Types.ObjectId;
  questionText: string;
  options: string[];
  correctAnswer: string;
  wordRef: Types.ObjectId;
  category: Types.ObjectId;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
