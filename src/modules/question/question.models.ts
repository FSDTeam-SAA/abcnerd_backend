import { Schema, model } from "mongoose";
import { IQuestion } from "./question.interface";

const questionSchema = new Schema<IQuestion>(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (val: string[]) => val.length >= 2 && val.length <= 4,
        message: "Options must be between 2 and 4",
      },
    },
    correctAnswer: { type: String, required: true, trim: true },
    wordRef: {
      type: Schema.Types.ObjectId,
      ref: "Wordmanagement",
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "CategoryWord",
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

questionSchema.pre<IQuestion>("validate", async function () {
  if (this.options && this.correctAnswer) {
    if (!this.options.includes(this.correctAnswer)) {
      throw new Error(
        `correctAnswer "${this.correctAnswer}" is not in options`,
      );
    }
  }
});

export const QuestionModel = model<IQuestion>("Question", questionSchema);
