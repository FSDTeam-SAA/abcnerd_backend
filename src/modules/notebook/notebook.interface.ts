import { Types } from "mongoose";

export interface INotebookEntry {
  quiz: Types.ObjectId;
  question: Types.ObjectId;
  questionText: string;
  selectedOption: Types.ObjectId;
  selectedOptionText: string;
  correctOption: Types.ObjectId;
  correctOptionText: string;
  wordRef?: Types.ObjectId;
  savedAt: Date;
}

export interface INotebook {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  entries: INotebookEntry[];
}
