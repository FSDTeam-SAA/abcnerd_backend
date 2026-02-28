import { NextFunction, Request, Response } from "express";
import {
  createQuizService,
  getAllQuizzesAdminService,
  getQuizByIdAdminService,
  updateQuizService,
  deleteQuizService,
  toggleQuizStatusService,
} from "./quiz.service";

export const createQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quiz = await createQuizService(req.body);
    res.status(201).json({
      success: true,
      message: "Quiz তৈরি হয়েছে",
      data: quiz,
    });
  } catch (err) {
    next(err);
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
    next(err);
  }
};

export const getQuizByIdAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quiz = await getQuizByIdAdminService(req.params.id as string);
    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (err) {
    next(err);
  }
};

export const updateQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quiz = await updateQuizService(req.params.id as string, req.body );
    res.status(200).json({
      success: true,
      message: "Quiz update হয়েছে",
      data: quiz,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteQuizService(req.params.id as string);
    res.status(200).json({
      success: true,
      message: "Quiz delete হয়েছে",
    });
  } catch (err) {
    next(err);
  }
};

export const toggleQuizStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quiz = await toggleQuizStatusService(req.params.id as string);
    res.status(200).json({
      success: true,
      message: `Quiz ${quiz.isActive ? "active" : "inactive"} করা হয়েছে`,
      data: quiz,
    });
  } catch (err) {
    next(err);
  }
};
