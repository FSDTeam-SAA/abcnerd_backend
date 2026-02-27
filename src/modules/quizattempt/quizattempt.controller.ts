import { NextFunction, Request, Response } from "express";
import { getAttemptHistoryService } from "./quizattempt.service";
import { Types } from "mongoose";

// ── User: নিজের সব attempt history ──
export const getAttemptHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;
    const attempts = await getAttemptHistoryService(userId as Types.ObjectId);

    res.status(200).json({
      success: true,
      total: attempts.length,
      data: attempts,
    });
  } catch (err) {
    next(err);
  }
};

// ── User: একটা specific attempt এর details ──
export const getAttemptById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user._id;
    const { attemptId } = req.params;

    const attempt = await getAttemptByIdService(userId, attemptId);

    res.status(200).json({
      success: true,
      data: attempt,
    });
  } catch (err) {
    next(err);
  }
};

// ── Admin: একটা quiz এর সব attempts ──
export const getAttemptsByQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { quizId } = req.params;
    const attempts = await getAttemptsByQuizService(quizId);

    res.status(200).json({
      success: true,
      total: attempts.length,
      data: attempts,
    });
  } catch (err) {
    next(err);
  }
};

// ── Admin: সব attempts ──
export const getAllAttempts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const attempts = await getAllAttemptsService();

    res.status(200).json({
      success: true,
      total: attempts.length,
      data: attempts,
    });
  } catch (err) {
    next(err);
  }
};
