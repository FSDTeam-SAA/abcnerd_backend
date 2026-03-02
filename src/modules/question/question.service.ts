import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";
import { CategoryWordModel } from "../categoryword/categoryword.models";
import { WordmanagementModel } from "../wordmanagement/wordmanagement.models";
import { QuestionModel } from "./question.models";

// ── Create Question ───────────────────────────────────────
export const createQuestionService = async (payload: any) => {
  const category = await CategoryWordModel.findById(payload.category);
  if (!category) throw new CustomError(404, "Category not found");

  const word = await WordmanagementModel.findById(payload.wordRef);
  if (!word) throw new CustomError(404, "Word not found");

  const uniqueOptions = new Set(payload.options);
  if (uniqueOptions.size !== payload.options.length)
    throw new CustomError(400, "Duplicate options are not allowed");

  if (!payload.options.includes(payload.correctAnswer))
    throw new CustomError(400, "correctAnswer must be one of the options");

  const question = await QuestionModel.create(payload);
  return question;
};

// ── Get All Questions (Admin) ─────────────────────────────
export const getAllQuestionsService = async (categoryId?: string) => {
  const filter: any = {};
  if (categoryId) {
    if (!Types.ObjectId.isValid(categoryId))
      throw new CustomError(400, "Invalid category id");
    filter.category = categoryId;
  }

  const questions = await QuestionModel.find(filter)
    .populate("category", "name slug")
    .populate("wordRef", "word description")
    .sort({ createdAt: -1 });

  if (!questions.length) throw new CustomError(404, "No questions found");
  return questions;
};

// ── Get Single Question ───────────────────────────────────
export const getQuestionByIdService = async (questionId: string) => {
  if (!Types.ObjectId.isValid(questionId))
    throw new CustomError(400, "Invalid question id");

  const question = await QuestionModel.findById(questionId)
    .populate("category", "name slug")
    .populate("wordRef", "word description synonyms");

  if (!question) throw new CustomError(404, "Question not found");
  return question;
};

// ── Update Question ───────────────────────────────────────
export const updateQuestionService = async (
  questionId: string,
  payload: any,
) => {
  if (!Types.ObjectId.isValid(questionId))
    throw new CustomError(400, "Invalid question id");

  if (payload.category) {
    const category = await CategoryWordModel.findById(payload.category);
    if (!category) throw new CustomError(404, "Category not found");
  }

  if (payload.wordRef) {
    const word = await WordmanagementModel.findById(payload.wordRef);
    if (!word) throw new CustomError(404, "Word not found");
  }

  if (payload.options && payload.correctAnswer) {
    const uniqueOptions = new Set(payload.options);
    if (uniqueOptions.size !== payload.options.length)
      throw new CustomError(400, "Duplicate options are not allowed");

    if (!payload.options.includes(payload.correctAnswer))
      throw new CustomError(400, "correctAnswer must be one of the options");
  }

  const question = await QuestionModel.findByIdAndUpdate(questionId, payload, {
    new: true,
    runValidators: true,
  });

  if (!question) throw new CustomError(404, "Question not found");
  return question;
};

// ── Delete Question ───────────────────────────────────────
export const deleteQuestionService = async (questionId: string) => {
  if (!Types.ObjectId.isValid(questionId))
    throw new CustomError(400, "Invalid question id");

  const question = await QuestionModel.findByIdAndDelete(questionId);
  if (!question) throw new CustomError(404, "Question not found");
  return question;
};

// ── Toggle Question Status ────────────────────────────────
export const toggleQuestionStatusService = async (questionId: string) => {
  if (!Types.ObjectId.isValid(questionId))
    throw new CustomError(400, "Invalid question id");

  const question = await QuestionModel.findById(questionId);
  if (!question) throw new CustomError(404, "Question not found");

  question.isActive = !question.isActive;
  await question.save();
  return question;
};
