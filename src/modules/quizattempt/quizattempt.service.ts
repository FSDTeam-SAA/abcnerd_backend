import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";
import { QuizModel } from "../quiz/quiz.models";
import { QuestionModel } from "../question/question.models";
import { QuizAttemptModel } from "./quizattempt.models";
import { Progress } from "../progress/progress.models";
import { NotebookModel } from "../notebook/notebook.models";

// ── Submit Quiz ───────────────────────────────────────────
export const submitQuizService = async (
  userId: Types.ObjectId,
  quizId: string,
  answers: { questionId: string; selectedAnswer: string }[],
) => {
  if (!Types.ObjectId.isValid(quizId))
    throw new CustomError(400, "Invalid quiz id");

  // quiz exist + user match check
  const quiz = await QuizModel.findOne({ _id: quizId, user: userId });
  if (!quiz) throw new CustomError(404, "Quiz not found");

  if (quiz.status === "completed")
    throw new CustomError(400, "This quiz has already been submitted");

  if (!answers || answers.length === 0)
    throw new CustomError(400, "Please provide at least one answer");

  let score = 0;
  const answeredQuestions = [];
  const wrongAnswers = [];
  const newAttemptedIds: Types.ObjectId[] = [];

  for (const answer of answers) {
    if (!Types.ObjectId.isValid(answer.questionId))
      throw new CustomError(400, `Invalid questionId: ${answer.questionId}`);

    const question = await QuestionModel.findById(answer.questionId);
    if (!question)
      throw new CustomError(404, `Question not found: ${answer.questionId}`);

    // check whether this question is part of the quiz
    if (!quiz.questions.map((q) => q.toString()).includes(answer.questionId))
      throw new CustomError(
        400,
        `Question ${answer.questionId} does not belong to this quiz`,
      );

    if (!question.options.includes(answer.selectedAnswer))
      throw new CustomError(
        400,
        `"${answer.selectedAnswer}" is not a valid option for this question`,
      );

    const isCorrect = question.correctAnswer === answer.selectedAnswer;
    if (isCorrect) score++;

    newAttemptedIds.push(question._id);

    answeredQuestions.push({
      question: question._id,
      questionText: question.questionText,
      options: question.options,
      selectedAnswer: answer.selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      wordRef: question.wordRef,
    });

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

  const percentage = Math.round((score / answers.length) * 100);

  // QuizAttempt save
  const attempt = await QuizAttemptModel.create({
    user: userId,
    quiz: quiz._id,
    answeredQuestions,
    score,
    totalQuestions: answers.length,
    percentage,
    completedAt: new Date(),
  });

  // Quiz status → completed + attempt ref add
  await QuizModel.findByIdAndUpdate(quizId, {
    status: "completed",
    attempt: attempt._id,
  });

  // update attemptedQuestions in progress
  await Progress.findOneAndUpdate(
    { user: userId },
    { $addToSet: { attemptedQuestions: { $each: newAttemptedIds } } },
    { upsert: true },
  );

  // save wrong answers to notebook
  if (wrongAnswers.length > 0) {
    await NotebookModel.findOneAndUpdate(
      { user: userId },
      { $push: { entries: { $each: wrongAnswers } } },
      { upsert: true },
    );
  }

  return {
    attemptId: attempt._id,
    quizId: quiz._id,
    score,
    totalQuestions: answers.length,
    percentage,
    result: answeredQuestions,
  };
};

// ── Get Attempt History ───────────────────────────────────
export const getAttemptHistoryService = async (userId: Types.ObjectId) => {
  const attempts = await QuizAttemptModel.find({ user: userId })
    .populate("quiz", "category totalQuestions status")
    .select("-answeredQuestions")
    .sort({ completedAt: -1 });

  if (!attempts.length) throw new CustomError(404, "No attempt history found");
  return attempts;
};

// ── Get Single Attempt ────────────────────────────────────
export const getAttemptByIdService = async (
  userId: Types.ObjectId,
  quizId: string,
) => {
  if (!Types.ObjectId.isValid(quizId))
    throw new CustomError(400, "Invalid quiz id");

  const attempt = await QuizAttemptModel.findOne({
    user: userId,
    quiz: quizId,
  })
    .populate("user", "name email")
    .populate("quiz", "category totalQuestions")
    .populate("answeredQuestions.wordRef", "word description synonyms");

  if (!attempt) throw new CustomError(404, "Attempt not found");
  return attempt;
};

// ── Admin: All Attempts ───────────────────────────────────
export const getAllAttemptsAdminService = async () => {
  return await QuizAttemptModel.find()
    .populate("user", "name email")
    .populate("quiz", "category totalQuestions")
    .select("-answeredQuestions")
    .sort({ completedAt: -1 });
};

// ── Admin: Attempts By Quiz ───────────────────────────────
export const getAttemptsByQuizAdminService = async (quizId: string) => {
  if (!Types.ObjectId.isValid(quizId))
    throw new CustomError(400, "Invalid quiz id");

  const attempts = await QuizAttemptModel.find({ quiz: quizId })
    .populate("user", "name email")
    .select("-answeredQuestions")
    .sort({ completedAt: -1 });

  if (!attempts.length)
    throw new CustomError(404, "No attempts found for this quiz");

  return attempts;
};
