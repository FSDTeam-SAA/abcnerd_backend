import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";
import { QuizModel } from "./quiz.models";
import { NotebookModel } from "../notebook/notebook.models";
import { QuizAttemptModel } from "../quizattempt/quizattempt.models";

// ── Admin: Quiz তৈরি ──
export const createQuizService = async (payload: any) => {
  const quiz = await QuizModel.create(payload);
  return quiz;
};

// ── Admin: সব Quiz দেখা ──
export const getAllQuizzesService = async () => {
  return await QuizModel.find().populate("category", "name slug");
};

// ── Admin: একটা Quiz দেখা ──
export const getQuizByIdService = async (quizId: string) => {
  const quiz = await QuizModel.findById(quizId).populate(
    "category",
    "name slug",
  );
  if (!quiz) throw new CustomError(404, "Quiz পাওয়া যায়নি");
  return quiz;
};

// ── Admin: Quiz update ──
export const updateQuizService = async (quizId: string, payload: any) => {
  const quiz = await QuizModel.findByIdAndUpdate(quizId, payload, {
    new: true,
  });
  if (!quiz) throw new CustomError(404, "Quiz পাওয়া যায়নি");
  return quiz;
};

// ── Admin: Quiz delete ──
export const deleteQuizService = async (quizId: string) => {
  const quiz = await QuizModel.findByIdAndDelete(quizId);
  if (!quiz) throw new CustomError(404, "Quiz পাওয়া যায়নি");
  return quiz;
};

// ── User: Active quizzes দেখা ──
export const getActiveQuizzesService = async () => {
  return await QuizModel.find({ isActive: true })
    .populate("category", "name slug")
    .select("-questions.correctOption");
};

// ── User: Quiz start — questions পাঠাবে, correctOption ছাড়া ──
export const startQuizService = async (quizId: string) => {
  const quiz = await QuizModel.findOne({
    _id: quizId,
    isActive: true,
  }).populate("category", "name slug");

  if (!quiz) throw new CustomError(404, "Quiz পাওয়া যায়নি");

  // correctOption hide করে পাঠাও
  const safeQuestions = quiz.questions.map((q: any) => ({
    _id: q._id,
    questionText: q.questionText,
    options: q.options,
    wordRef: q.wordRef,
    // correctOption পাঠাচ্ছি না
  }));

  return {
    _id: quiz._id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    totalQuestions: quiz.questions.length,
    questions: safeQuestions,
  };
};

// ── User: Quiz submit ──
export const submitQuizService = async (
  userId: Types.ObjectId,
  quizId: string,
  answers: { questionId: string; selectedOptionId: string }[],
) => {
  const quiz = await QuizModel.findById(quizId);
  if (!quiz) throw new CustomError(404, "Quiz পাওয়া যায়নি");

  let score = 0;
  const answeredQuestions = [];
  const wrongAnswers = [];

  for (const answer of answers) {
    const question = quiz.questions.find(
      (q: any) => q._id.toString() === answer.questionId,
    );
    if (!question) continue;

    const isCorrect =
      question.correctOption.toString() === answer.selectedOptionId;

    if (isCorrect) score++;

    answeredQuestions.push({
      question: question._id,
      selectedOption: new Types.ObjectId(answer.selectedOptionId),
      isCorrect,
    });

    // wrong হলে notebook এর জন্য রাখো
    if (!isCorrect) {
      const selectedOpt = question.options.find(
        (o: any) => o._id.toString() === answer.selectedOptionId,
      );
      const correctOpt = question.options.find(
        (o: any) => o._id.toString() === question.correctOption.toString(),
      );

      wrongAnswers.push({
        quiz: quiz._id,
        question: question._id,
        questionText: question.questionText,
        selectedOption: new Types.ObjectId(answer.selectedOptionId),
        selectedOptionText: selectedOpt?.text || "",
        correctOption: question.correctOption,
        correctOptionText: correctOpt?.text || "",
        wordRef: question.wordRef,
        savedAt: new Date(),
      });
    }
  }

  // Attempt save
  const attempt = await QuizAttemptModel.create({
    user: userId,
    quiz: quiz._id,
    answeredQuestions,
    score,
    totalQuestions: quiz.questions.length,
    completedAt: new Date(),
  });

  // Wrong answers notebook এ save
  if (wrongAnswers.length > 0) {
    await NotebookModel.findOneAndUpdate(
      { user: userId },
      { $push: { entries: { $each: wrongAnswers } } },
      { upsert: true },
    );
  }

  // Result তৈরি করো questions এর details সহ
  const result = answeredQuestions.map((a) => {
    const question = quiz.questions.find(
      (q: any) => q._id.toString() === a.question.toString(),
    );
    return {
      questionId: a.question,
      questionText: question?.questionText,
      selectedOption: a.selectedOption,
      correctOption: question?.correctOption,
      isCorrect: a.isCorrect,
      options: question?.options,
    };
  });

  return {
    attemptId: attempt._id,
    score,
    totalQuestions: quiz.questions.length,
    percentage: Math.round((score / quiz.questions.length) * 100),
    result,
  };
};

// ── User: Attempt history ──
export const getAttemptHistoryService = async (userId: Types.ObjectId) => {
  return await QuizAttemptModel.find({ user: userId })
    .populate("quiz", "title category")
    .sort({ completedAt: -1 });
};

// ── User: Notebook দেখা ──
export const getNotebookService = async (userId: Types.ObjectId) => {
  const notebook = await NotebookModel.findOne({ user: userId }).populate(
    "entries.wordRef",
    "word description",
  );
  if (!notebook) throw new CustomError(404, "Notebook এ কিছু নেই");
  return notebook;
};
