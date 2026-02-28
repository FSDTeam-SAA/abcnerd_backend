import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";
import { CategoryWordModel } from "../categoryword/categoryword.models";
import { WordmanagementModel } from "../wordmanagement/wordmanagement.models";
import { QuizModel } from "./quiz.models";

// ── Create Quiz ──────────────────────────────────────────
export const createQuizService = async (payload: any) => {
  // category exist করে কিনা check
  const category = await CategoryWordModel.findById(payload.category);
  if (!category) throw new CustomError(404, "Category পাওয়া যায়নি");

  // প্রতিটা question validate করো
  for (const q of payload.questions) {
    // duplicate options check
    const uniqueOptions = new Set(q.options);
    if (uniqueOptions.size !== q.options.length) {
      throw new CustomError(
        400,
        `"${q.questionText}" — duplicate options দেওয়া যাবে না`,
      );
    }

    // correctAnswer options এর মধ্যে আছে কিনা
    if (!q.options.includes(q.correctAnswer)) {
      throw new CustomError(
        400,
        `"${q.questionText}" — correctAnswer অবশ্যই options এর মধ্যে একটা হতে হবে`,
      );
    }

    // wordRef দিলে সেটা exist করে কিনা check
    if (q.wordRef) {
      const word = await WordmanagementModel.findById(q.wordRef);
      if (!word)
        throw new CustomError(404, `wordRef "${q.wordRef}" পাওয়া যায়নি`);
    }
  }

  const quiz = await QuizModel.create(payload);
  return quiz;
};

// ── Get All Quizzes (Admin) ───────────────────────────────
export const getAllQuizzesAdminService = async () => {
  const quizzes = await QuizModel.find()
    .populate("category", "name slug")
    .sort({ createdAt: -1 });

  if (!quizzes.length) throw new CustomError(404, "কোনো quiz পাওয়া যায়নি");
  return quizzes;
};

// ── Get Single Quiz (Admin) ───────────────────────────────
export const getQuizByIdAdminService = async (quizId: string) => {
  if (!Types.ObjectId.isValid(quizId))
    throw new CustomError(400, "Invalid quiz id");

  const quiz = await QuizModel.findById(quizId)
    .populate("category", "name slug")
    .populate("questions.wordRef", "word description");

  if (!quiz) throw new CustomError(404, "Quiz পাওয়া যায়নি");
  return quiz;
};

// ── Update Quiz ───────────────────────────────────────────
export const updateQuizService = async (quizId: string, payload: any) => {
  if (!Types.ObjectId.isValid(quizId))
    throw new CustomError(400, "Invalid quiz id");

  // category update করলে exist check
  if (payload.category) {
    const category = await CategoryWordModel.findById(payload.category);
    if (!category) throw new CustomError(404, "Category পাওয়া যায়নি");
  }

  // questions update করলে validate
  if (payload.questions) {
    for (const q of payload.questions) {
      const uniqueOptions = new Set(q.options);
      if (uniqueOptions.size !== q.options.length) {
        throw new CustomError(
          400,
          `"${q.questionText}" — duplicate options দেওয়া যাবে না`,
        );
      }

      if (!q.options.includes(q.correctAnswer)) {
        throw new CustomError(
          400,
          `"${q.questionText}" — correctAnswer অবশ্যই options এর মধ্যে একটা হতে হবে`,
        );
      }

      if (q.wordRef) {
        const word = await WordmanagementModel.findById(q.wordRef);
        if (!word)
          throw new CustomError(404, `wordRef "${q.wordRef}" পাওয়া যায়নি`);
      }
    }
  }

  const quiz = await QuizModel.findByIdAndUpdate(quizId, payload, {
    new: true,
    runValidators: true,
  });

  if (!quiz) throw new CustomError(404, "Quiz পাওয়া যায়নি");
  return quiz;
};

// ── Delete Quiz ───────────────────────────────────────────
export const deleteQuizService = async (quizId: string) => {
  if (!Types.ObjectId.isValid(quizId))
    throw new CustomError(400, "Invalid quiz id");

  const quiz = await QuizModel.findByIdAndDelete(quizId);
  if (!quiz) throw new CustomError(404, "Quiz পাওয়া যায়নি");
  return quiz;
};

// ── Toggle Active Status ──────────────────────────────────
export const toggleQuizStatusService = async (quizId: string) => {
  if (!Types.ObjectId.isValid(quizId))
    throw new CustomError(400, "Invalid quiz id");

  const quiz = await QuizModel.findById(quizId);
  if (!quiz) throw new CustomError(404, "Quiz পাওয়া যায়নি");

  quiz.isActive = !quiz.isActive;
  await quiz.save();
  return quiz;
};
