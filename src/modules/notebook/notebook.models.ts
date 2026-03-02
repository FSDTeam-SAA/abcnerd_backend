import { Schema, model } from "mongoose";
import { INotebook } from "./notebook.interface";

const notebookEntrySchema = new Schema<any>({
  quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
  question: { type: Schema.Types.ObjectId, required: true },
  questionText: { type: String, required: true },
  options: { type: [String], required: true },
  selectedAnswer: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  wordRef: { type: Schema.Types.ObjectId, ref: "Wordmanagement" },
  savedAt: { type: Date, default: Date.now },
});

const notebookSchema = new Schema<INotebook>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    entries: [notebookEntrySchema],
  },
  { timestamps: true },
);

export const NotebookModel = model<INotebook>("Notebook", notebookSchema);
