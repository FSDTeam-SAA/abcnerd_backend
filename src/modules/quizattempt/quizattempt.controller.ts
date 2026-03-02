import { NextFunction, Request, Response } from "express";
import {
  submitQuizService,
  getAttemptHistoryService,
  getAttemptByIdService,
  getAllAttemptsAdminService,
  getAttemptsByQuizAdminService,
} from "./quizattempt.service";
import { Types } from "mongoose";

export const submitQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await submitQuizService(
      req.user?._id as Types.ObjectId,
      req.params.quizId as string,
      req.body.answers,
    );
    res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
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
