import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";
import { QuizModel } from "../quiz/quiz.models";
import { QuizAttemptModel } from "./quizattempt.models";
import { NotebookModel } from "../notebook/notebook.models";
import { IAnsweredQuestion } from "./quizattempt.interface";

// ── User: Active Quizzes দেখা ─────────────────────────────
export const getActiveQuizzesService = async () => {
  const quizzes = await QuizModel.find({ isActive: true })
    .populate("category", "name slug")
    .select("-questions.correctAnswer")
    .sort({ createdAt: -1 });

  if (!quizzes.length) throw new CustomError(404, "কোনো quiz পাওয়া যায়নি");
  return quizzes;
};

// ── User: Quiz Start ──────────────────────────────────────
export const startQuizService = async (quizId: string) => {
  if (!Types.ObjectId.isValid(quizId))
    throw new CustomError(400, "Invalid quiz id");

  const quiz = await QuizModel.findOne({ _id: quizId, isActive: true })
    .populate("category", "name slug")
    .populate("questions.wordRef", "word");

  if (!quiz) throw new CustomError(404, "Quiz পাওয়া যায়নি বা inactive");

  // correctAnswer বাদ দিয়ে পাঠাও
  const safeQuestions = quiz.questions.map((q: any) => ({
    _id: q._id,
    questionText: q.questionText,
    options: q.options,
    wordRef: q.wordRef,
  }));

  return {
    _id: quiz._id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    totalQuestions: quiz.questions.length,
    timePerQuestion: 60, // seconds
    questions: safeQuestions,
  };
};

// ── User: Quiz Submit ─────────────────────────────────────
export const submitQuizService = async (
  userId: Types.ObjectId,
  quizId: string,
  answers: { questionId: string; selectedAnswer: string }[],
) => {
  if (!Types.ObjectId.isValid(quizId))
    throw new CustomError(400, "Invalid quiz id");

  const quiz = await QuizModel.findById(quizId);
  if (!quiz) throw new CustomError(404, "Quiz পাওয়া যায়নি");

  if (!answers || answers.length === 0)
    throw new CustomError(400, "কমপক্ষে ১টা answer দাও");

  let score = 0;
  const answeredQuestions = [];
  const wrongAnswers = [];

  for (const answer of answers) {
    const question = quiz.questions.find(
      (q: any) => q._id.toString() === answer.questionId,
    );

    if (!question)
      throw new CustomError(
        400,
        `questionId "${answer.questionId}" এই quiz এ নেই`,
      );

    if (!question.options.includes(answer.selectedAnswer))
      throw new CustomError(
        400,
        `"${answer.selectedAnswer}" এই question এর options এর মধ্যে নেই`,
      );

    const isCorrect = question.correctAnswer === answer.selectedAnswer;
    if (isCorrect) score++;

    answeredQuestions.push({
      question: question._id,
      questionText: question.questionText,
      options: question.options,
      selectedAnswer: answer.selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      wordRef: question.wordRef,
    });

    // wrong হলে notebook এর জন্য রাখো
    if (!isCorrect) {
      wrongAnswers.push({
        quiz: quiz._id,
        question: question._id,
        questionText: question.questionText,
        options: question.options,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        wordRef: question.wordRef,
        savedAt: new Date(),
      });
    }
  }

  const percentage = Math.round((score / quiz.questions.length) * 100);

  // Attempt save
  const attempt = await QuizAttemptModel.create({
    user: userId,
    quiz: quiz._id,
    answeredQuestions : answeredQuestions as IAnsweredQuestion[],
    score,
    totalQuestions: quiz.questions.length,
    percentage,
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

  return {
    attemptId: attempt._id,
    score,
    totalQuestions: quiz.questions.length,
    percentage,
    result: answeredQuestions,
  };
};

// ── User: নিজের সব attempt history ───────────────────────
export const getAttemptHistoryService = async (userId: Types.ObjectId) => {
  const attempts = await QuizAttemptModel.find({ user: userId })
    .populate("quiz", "title description category")
    .select("-answeredQuestions") // summary only
    .sort({ completedAt: -1 });

  if (!attempts.length) throw new CustomError(404, "কোনো attempt history নেই");
  return attempts;
};

// ── User: একটা specific attempt এর details ───────────────
export const getAttemptByIdService = async (
  userId: Types.ObjectId,
  attemptId: string,
) => {
  if (!Types.ObjectId.isValid(attemptId))
    throw new CustomError(400, "Invalid attempt id");

  const attempt = await QuizAttemptModel.findOne({
    _id: attemptId,
    user: userId,
  }).populate("quiz", "title description category");

  if (!attempt) throw new CustomError(404, "Attempt পাওয়া যায়নি");
  return attempt;
};

// ── Admin: সব attempts ────────────────────────────────────
export const getAllAttemptsAdminService = async () => {
  return await QuizAttemptModel.find()
    .populate("user", "name email")
    .populate("quiz", "title")
    .select("-answeredQuestions")
    .sort({ completedAt: -1 });
};

// ── Admin: একটা quiz এর সব attempts ──────────────────────
export const getAttemptsByQuizAdminService = async (quizId: string) => {
  if (!Types.ObjectId.isValid(quizId))
    throw new CustomError(400, "Invalid quiz id");

  const attempts = await QuizAttemptModel.find({ quiz: quizId })
    .populate("user", "name email")
    .select("-answeredQuestions")
    .sort({ completedAt: -1 });

  if (!attempts.length)
    throw new CustomError(404, "এই quiz এ কোনো attempt নেই");

  return attempts;
};
