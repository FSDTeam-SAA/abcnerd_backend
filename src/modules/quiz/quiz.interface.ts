import { Document, Types } from "mongoose";

// IQuestion কে Document থেকে extend করতে হবে যাতে mongoose-এর internal methods পাওয়া যায়
export interface IQuestion extends Document {
  _id: Types.ObjectId;
  questionText: string;
  options: string[];
  correctAnswer: string;
  wordRef?: Types.ObjectId; // any এর বদলে Types.ObjectId দেওয়া ভালো
}

export interface IQuiz extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  category: Types.ObjectId;
  questions: IQuestion[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
