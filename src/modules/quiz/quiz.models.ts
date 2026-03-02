import { Schema, model } from "mongoose";
import { IQuiz } from "./quiz.interface";

const quizSchema = new Schema<IQuiz>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "CategoryWord",
      required: true,
    },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    status: {
      type: String,
      enum: ["ongoing", "completed", "abandoned"],
      default: "ongoing",
    },
    totalQuestions: { type: Number, required: true },
    attempt: { type: Schema.Types.ObjectId, ref: "QuizAttempt" },
  },
  { timestamps: true },
);

export const QuizModel = model<IQuiz>("Quiz", quizSchema);
