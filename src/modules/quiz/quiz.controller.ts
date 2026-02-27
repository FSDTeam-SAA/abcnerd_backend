import { NextFunction, Request, Response } from "express";
import {
  createQuizService,
  getAllQuizzesService,
  getQuizByIdService,
  updateQuizService,
  deleteQuizService,
  getActiveQuizzesService,
  startQuizService,
  submitQuizService,
  getAttemptHistoryService,
  getNotebookService,
} from "./quiz.service";
import { Types } from "mongoose";

// ── Admin ──
export const createQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quiz = await createQuizService(req.body);
    res
      .status(201)
      .json({ success: true, message: "Quiz তৈরি হয়েছে", data: quiz });
  } catch (err) {
    next(err);
  }
};

export const getAllQuizzes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quizzes = await getAllQuizzesService();
    res.status(200).json({ success: true, data: quizzes });
  } catch (err) {
    next(err);
  }
};

export const getQuizById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quiz = await getQuizByIdService(req.params.id as string);
    res.status(200).json({ success: true, data: quiz });
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
    const quiz = await updateQuizService(req.params.id as string, req.body);
    res
      .status(200)
      .json({ success: true, message: "Quiz update হয়েছে", data: quiz });
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
    res.status(200).json({ success: true, message: "Quiz delete হয়েছে" });
  } catch (err) {
    next(err);
  }
};

// ── User ──
export const getActiveQuizzes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quizzes = await getActiveQuizzesService();
    res.status(200).json({ success: true, data: quizzes });
  } catch (err) {
    next(err);
  }
};

export const startQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const quiz = await startQuizService(req.params.id as string);
    res.status(200).json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
};

export const submitQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;
    const result = await submitQuizService(
      userId as Types.ObjectId,
      req.params.id as string,
      req.body.answers,
    );
    res
      .status(200)
      .json({ success: true, message: "Quiz submit হয়েছে", data: result });
  } catch (err) {
    next(err);
  }
};

export const getAttemptHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const history = await getAttemptHistoryService(
      req.user?._id as Types.ObjectId,
    );
    res.status(200).json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

export const getNotebook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const notebook = await getNotebookService(req.user?._id as Types.ObjectId);
    res.status(200).json({ success: true, data: notebook });
  } catch (err) {
    next(err);
  }
};
