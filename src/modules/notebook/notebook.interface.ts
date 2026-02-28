import { Types } from "mongoose";

export interface INotebookEntry {
  _id: Types.ObjectId;
  quiz: Types.ObjectId;
  question: Types.ObjectId;
  questionText: string;
  options: string[];
  selectedAnswer: string;
  correctAnswer: string;
  wordRef?: Types.ObjectId;
  savedAt: Date;
}

export interface INotebook {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  entries: INotebookEntry[];
}
