import { NextFunction, Request, Response } from "express";
import {
  getNotebookService,
  getNotebookByQuizService,
  deleteNotebookEntryService,
  clearNotebookService,
} from "./notebook.service";
import { Types } from "mongoose";

// ── User এর পুরো notebook ──
export const getNotebook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;
    const notebook = await getNotebookService(userId as Types.ObjectId);

    res.status(200).json({
      success: true,
      total: notebook.entries.length,
      data: notebook,
    });
  } catch (err) {
    next(err);
  }
};

// ── একটা specific quiz এর wrong answers ──
export const getNotebookByQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;
    const { quizId } = req.params;

    const entries = await getNotebookByQuizService(userId as Types.ObjectId, quizId as string);

    res.status(200).json({
      success: true,
      total: entries.length,
      data: entries,
    });
  } catch (err) {
    next(err);
  }
};

// ── একটা entry delete ──
export const deleteNotebookEntry = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;
    const { entryId } = req.params;

    const notebook = await deleteNotebookEntryService(userId as Types.ObjectId, entryId as string);

    res.status(200).json({
      success: true,
      message: "Entry delete হয়েছে",
      data: notebook,
    });
  } catch (err) {
    next(err);
  }
};

// ── পুরো notebook clear ──
export const clearNotebook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;
    await clearNotebookService(userId as Types.ObjectId);

    res.status(200).json({
      success: true,
      message: "Notebook clear হয়েছে",
    });
  } catch (err) {
    next(err);
  }
};
