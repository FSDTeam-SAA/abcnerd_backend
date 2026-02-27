import { Schema, model } from "mongoose";
import { IQuiz } from "./quiz.interface";

const optionSchema = new Schema<any>({
  text: { type: String, required: true },
});

const questionSchema = new Schema<any>({
  questionText: { type: String, required: true },
  options: { type: [optionSchema], required: true },
  correctOption: { type: Schema.Types.ObjectId, required: true },
  wordRef: { type: Schema.Types.ObjectId, ref: "Wordmanagement" },
});

const quizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: {
      type: Schema.Types.ObjectId,
      ref: "CategoryWord",
      required: true,
    },
    questions: { type: [questionSchema], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const QuizModel = model<IQuiz>("Quiz", quizSchema);
