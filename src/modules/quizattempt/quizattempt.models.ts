import { Schema, model } from "mongoose";
import { IQuizAttempt } from "./quizattempt.interface";

const answeredQuestionSchema = new Schema<any>({
  question: { type: Schema.Types.ObjectId, required: true },
  selectedOption: { type: Schema.Types.ObjectId, required: true },
  isCorrect: { type: Boolean, required: true },
});

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    answeredQuestions: [answeredQuestionSchema],
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const QuizAttemptModel = model<IQuizAttempt>(
  "QuizAttempt",
  quizAttemptSchema,
);
