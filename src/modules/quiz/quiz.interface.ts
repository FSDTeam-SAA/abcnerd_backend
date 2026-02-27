import { Types } from "mongoose";

export interface IOption {
  _id: Types.ObjectId;
  text: string;
}

export interface IQuestion {
  _id: Types.ObjectId;
  questionText: string;
  options: IOption[];
  correctOption: Types.ObjectId; // option এর _id
  wordRef?: Types.ObjectId; // কোন word থেকে এসেছে (optional ref)
}

export interface IQuiz {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  category: Types.ObjectId; // CategoryWord ref
  questions: IQuestion[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
