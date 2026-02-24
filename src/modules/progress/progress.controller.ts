import { NextFunction, Request, Response } from "express";
import {
  getProgressService,
  getProgressWordsService,
} from "./progress.service";
import { Types } from "mongoose";

// GET /api/progress
export const getProgress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;
    const result = await getProgressService(userId as Types.ObjectId);

    res.status(200).json({
      success: true,
      message: "Progress retrived successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/progress/words?type=memorized
// GET /api/progress/words?type=reviewLater
export const getProgressWords = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;
    const { type } = req.query;

    if (!["memorized", "reviewLater"].includes(type as string)) {
      res.status(400).json({
        success: false,
        message: "two blocked words: memorized, reviewLater. Nothing else",
      });
      return;
    }

    const words = await getProgressWordsService(
      userId as Types.ObjectId,
      type as "memorized" | "reviewLater",
    );

    res.status(200).json({
      success: true,
      message: `${type} words retrived successfully`,
      total: (words as any[]).length,
      data: words,
    });
  } catch (err) {
    next(err);
  }
};
