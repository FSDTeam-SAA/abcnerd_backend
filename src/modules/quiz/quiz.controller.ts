import { NextFunction, Request, Response } from "express";
import {
  generateQuizService,
  getUserQuizHistoryService,
  getQuizByIdService,
  getAllQuizzesAdminService,
  retakeQuizService,
} from "./quiz.service";
import { Types } from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

export const generateQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;
    const { categoryId, questionCount } = req.query;

    const quiz = await generateQuizService(
      userId as Types.ObjectId,
      categoryId as string,
      questionCount ? Number(questionCount) : 10,
    );

    res.status(201).json({ success: true, data: quiz });
  } catch (err) {
    next(err as Error);
  }
};

export const getUserQuizHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quizzes = await getUserQuizHistoryService(
      req.user?._id as Types.ObjectId,
    );
    res.status(200).json({
      success: true,
      total: quizzes.length,
      data: quizzes,
    });
  } catch (err) {
    next(err as Error);
  }
};

export const getQuizById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quiz = await getQuizByIdService(
      req.user?._id as Types.ObjectId,
      req.params.quizId as string,
    );
    res.status(200).json({ success: true, data: quiz });
  } catch (err) {
    next(err as Error);
  }
};

export const getAllQuizzesAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quizzes = await getAllQuizzesAdminService();
    res.status(200).json({
      success: true,
      total: quizzes.length,
      data: quizzes,
    });
  } catch (err) {
    next(err as Error);
  }
};

export const retakeQuizController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
    const { quizId } = req.params;

    const result = await retakeQuizService(userId, quizId as string);

    ApiResponse.sendSuccess(res, 200, "Quiz restarted successfully", result);
  },
);
