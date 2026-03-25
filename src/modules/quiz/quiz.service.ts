import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";
import { CategoryWordModel } from "../categoryword/categoryword.models";
import { Progress } from "../progress/progress.models";
import { QuestionModel } from "../question/question.models";
import { NotebookModel } from "../notebook/notebook.models";
import { QuizModel } from "./quiz.models";
import { QuizAttemptModel } from "../quizattempt/quizattempt.models";
import { paginationHelper } from "../../utils/pagination";

export const generateQuizService = async (
  userId: Types.ObjectId,
  categoryId: string,
  questionCount: number = 10,
) => {
  if (!Types.ObjectId.isValid(categoryId))
    throw new CustomError(400, "Invalid category id");

  const category = await CategoryWordModel.findById(categoryId);
  if (!category) throw new CustomError(404, "Category not found");

  const progress = await Progress.findOne({ user: userId });
  const memorizedWords = progress?.memorized || [];
  const attemptedQuestions = progress?.attemptedQuestions || [];

  if (memorizedWords.length === 0)
    throw new CustomError(
      400,
      "You have not memorized any words yet. Memorize some words first to take a quiz.",
    );

  const allQuestions = await QuestionModel.find({
    category: categoryId,
    isActive: true,
  });

  if (!allQuestions.length)
    throw new CustomError(404, "No questions found for this category");

  const memorizedStrs = memorizedWords.map((id) => id.toString());
  const attemptedStrs = attemptedQuestions.map((id) => id.toString());

  const eligibleQuestions = allQuestions.filter(
    (q) =>
      q.wordRef &&
      memorizedStrs.includes(q.wordRef.toString()) &&
      !attemptedStrs.includes(q._id.toString()),
  );

  if (eligibleQuestions.length === 0)
    throw new CustomError(
      400,
      "You have attempted all available questions for your memorized words. Memorize more words to unlock new questions.",
    );

  const notebook = await NotebookModel.findOne({ user: userId });
  const wrongQuestionIds = new Set(
    (notebook?.entries || []).map((e) => e.question.toString()),
  );

  const wrongFirst = eligibleQuestions.filter((q) =>
    wrongQuestionIds.has(q._id.toString()),
  );
  const others = eligibleQuestions
    .filter((q) => !wrongQuestionIds.has(q._id.toString()))
    .sort(() => Math.random() - 0.5);

  const finalQuestions = [...wrongFirst, ...others].slice(0, questionCount);

  const quiz = await QuizModel.create({
    user: userId,
    category: categoryId,
    questions: finalQuestions.map((q) => q._id),
    status: "ongoing",
    totalQuestions: finalQuestions.length,
  });

  const safeQuestions = finalQuestions.map((q) => ({
    _id: q._id,
    questionText: q.questionText,
    options: q.options,
    correctAnswer: q.correctAnswer,
    wordRef: q.wordRef,
  }));

  return {
    quizId: quiz._id,
    category: { _id: category._id, name: category.name },
    totalQuestions: finalQuestions.length,
    timePerQuestion: 60,
    questions: safeQuestions,
  };
};

export const getUserQuizHistoryService = async (userId: Types.ObjectId) => {
  const quizzes = await QuizModel.find({ user: userId })
    .populate("category", "name slug")
    .populate("attempt")
    .sort({ createdAt: -1 });

  if (!quizzes.length) throw new CustomError(404, "No quiz history found");
  return quizzes;
};

export const getQuizByIdService = async (
  userId: Types.ObjectId,
  quizId: string,
) => {
  if (!Types.ObjectId.isValid(quizId))
    throw new CustomError(400, "Invalid quiz id");

  const quiz = await QuizModel.findOne({ _id: quizId, user: userId })
    .populate("category", "name slug")
    .populate("questions")
    .populate("attempt");

  if (!quiz) throw new CustomError(404, "Quiz not found");
  return quiz;
};

export const getAllQuizzesAdminService = async (req: any) => {
  const { page: pageBody, limit: limitBody, sortBy = "desc" } = req.query;

  // Pagination
  const { page, limit, skip } = paginationHelper(pageBody, limitBody);

  // Validate sortBy
  const allowedSort = ["asc", "desc"];
  if (!allowedSort.includes(sortBy)) {
    throw new CustomError(
      400,
      "Invalid sortBy, allowed values are 'asc' and 'desc'",
    );
  }

  const sort: any = sortBy === "asc" ? { createdAt: 1 } : { createdAt: -1 };

  const quizzes = await QuizModel.find()
    .populate("user", "name email")
    .populate("category", "name slug")
    .populate("attempt")
    .skip(skip)
    .limit(limit)
    .sort(sort);

  if (!quizzes.length) throw new CustomError(404, "No quizzes found");

  const total = await QuizModel.countDocuments();

  return {
    quizzes,
    meta: {
      page,
      limit,
      totalQuizzes: total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const retakeQuizService = async (
  userId: Types.ObjectId,
  quizId: string,
) => {
  if (!Types.ObjectId.isValid(quizId)) {
    throw new CustomError(400, "Invalid quiz id");
  }

  const quiz = await QuizModel.findOne({ _id: quizId, user: userId });

  if (!quiz) {
    throw new CustomError(404, "Quiz not found");
  }

  // delete old attempt
  await QuizAttemptModel.deleteMany({ quizId: quiz._id });

  // remove quiz questions from progress attemptedQuestions
  const progress = await Progress.findOne({ user: userId });

  if (progress) {
    progress.attemptedQuestions = progress.attemptedQuestions.filter(
      (qId) => !quiz.questions.includes(qId),
    );

    await progress.save();
  }

  // create new quiz with same questions
  const newQuiz = await QuizModel.create({
    user: userId,
    category: quiz.category,
    questions: quiz.questions,
    status: "ongoing",
    totalQuestions: quiz.questions.length,
  });

  return {
    message: "Quiz retake started",
    quizId: newQuiz._id,
    totalQuestions: quiz.questions.length,
    timePerQuestion: 60,
  };
};
