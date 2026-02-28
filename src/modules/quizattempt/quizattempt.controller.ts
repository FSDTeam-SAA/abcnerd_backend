import { NextFunction, Request, Response } from "express";

import { Types } from "mongoose";
import {
  getActiveQuizzesService,
  getAllAttemptsAdminService,
  getAttemptByIdService,
  getAttemptHistoryService,
  getAttemptsByQuizAdminService,
  startQuizService,
  submitQuizService,
} from "./quizattempt.service";

// ── User ──────────────────────────────────────────────────

export const getActiveQuizzes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quizzes = await getActiveQuizzesService();
    res
      .status(200)
      .json({ success: true, total: quizzes.length, data: quizzes });
  } catch (err) {
    next(err as Error);
  }
};

export const startQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quiz = await startQuizService(req.params.quizId as string);
    res.status(200).json({ success: true, data: quiz });
  } catch (err) {
    next(err as Error);
  }
};

export const submitQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;
    const { answers } = req.body;

    const result = await submitQuizService(
      userId as Types.ObjectId,
      req.params.quizId as string,
      answers,
    );
    res.status(200).json({
      success: true,
      message: "Quiz submit হয়েছে",
      data: result,
    });
  } catch (err) {
    next(err as Error);
  }
};

export const getAttemptHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const attempts = await getAttemptHistoryService(
      req.user?._id as Types.ObjectId,
    );
    res
      .status(200)
      .json({ success: true, total: attempts.length, data: attempts });
  } catch (err) {
    next(err as Error);
  }
};

export const getAttemptById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const attempt = await getAttemptByIdService(
      req.user?._id as Types.ObjectId,
      req.params.attemptId as string,
    );
    res.status(200).json({ success: true, data: attempt });
  } catch (err) {
    next(err as Error);
  }
};

// ── Admin ─────────────────────────────────────────────────

export const getAllAttemptsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const attempts = await getAllAttemptsAdminService();
    res
      .status(200)
      .json({ success: true, total: attempts.length, data: attempts });
  } catch (err) {
    next(err as Error);
  }
};

export const getAttemptsByQuizAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const attempts = await getAttemptsByQuizAdminService(
      req.params.quizId as string,
    );
    res
      .status(200)
      .json({ success: true, total: attempts.length, data: attempts });
  } catch (err) {
    next(err as Error);
  }
};
