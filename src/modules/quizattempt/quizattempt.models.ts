import { Schema, model } from "mongoose";
import { IQuizAttempt } from "./quizattempt.interface";


const answeredQuestionSchema = new Schema<any>(
  {
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    questionText: { type: String, required: true },
    options: { type: [String], required: true },
    selectedAnswer: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    wordRef: { type: Schema.Types.ObjectId, ref: "Wordmanagement" },
  },
  { _id: false },
);

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    answeredQuestions: [answeredQuestionSchema],
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const QuizAttemptModel = model<IQuizAttempt>(
  "QuizAttempt",
  quizAttemptSchema,
);
