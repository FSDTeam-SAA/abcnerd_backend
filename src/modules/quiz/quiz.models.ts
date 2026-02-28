import { Schema, model } from "mongoose";
import { IQuestion, IQuiz } from "./quiz.interface";

// ১. Question Schema (Sub-document)
const questionSchema = new Schema<IQuestion>({
  questionText: { type: String, required: true, trim: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (val: string[]) => val.length >= 2 && val.length <= 4,
      message: "options কমপক্ষে ২টা এবং সর্বোচ্চ ৪টা হবে",
    },
  },
  correctAnswer: { type: String, required: true, trim: true },
  wordRef: { type: Schema.Types.ObjectId, ref: "Wordmanagement" },
});

/**
 * ২. 'pre' ভ্যালিডেশন ফিক্স
 * 'next' প্যারামিটার বাদ দিয়ে async ফাংশন ব্যবহার করা হয়েছে
 * যাতে "next is not a function" এরর না আসে।
 */
questionSchema.pre<IQuestion>("validate", async function () {
  if (this.options && this.correctAnswer) {
    const isValid = this.options.includes(this.correctAnswer);
    if (!isValid) {
      throw new Error(
        `correctAnswer "${this.correctAnswer}" options এর মধ্যে নেই`,
      );
    }
  }
});

// ৩. Quiz Schema
const quizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "CategoryWord",
      required: true,
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (val: IQuestion[]) => Array.isArray(val) && val.length >= 1,
        message: "কমপক্ষে ১টা question থাকতে হবে",
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const QuizModel = model<IQuiz>("Quiz", quizSchema);
