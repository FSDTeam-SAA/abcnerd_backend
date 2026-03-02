import { Request, Response } from "express";

import { Types } from "mongoose";

import {
  getNotebookService,
  getNotebookByQuizService,
  deleteNotebookEntryService,
  clearNotebookService,
} from "./notebook.service";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";

// ── Get Full Notebook ─────────────────────────────────────

export const getNotebook = asyncHandler(async (req: Request, res: Response) => {
  const notebook = await getNotebookService(req.user!._id as Types.ObjectId);

  ApiResponse.sendSuccess(res, 200, "Notebook fetched successfully", {
    total: notebook.entries.length,
    data: notebook,
  });
});

// ── Get Notebook Entries By Quiz ──────────────────────────

export const getNotebookByQuiz = asyncHandler(
  async (req: Request, res: Response) => {
    const entries = await getNotebookByQuizService(
      req.user!._id as Types.ObjectId,
      req.params.quizId as string,
    );

    ApiResponse.sendSuccess(res, 200, "Notebook entries fetched successfully", {
      total: entries.length,
      data: entries,
    });
  },
);

// ── Delete Single Notebook Entry ──────────────────────────

export const deleteNotebookEntry = asyncHandler(
  async (req: Request, res: Response) => {
    const notebook = await deleteNotebookEntryService(
      req.user!._id as Types.ObjectId,
      req.params.entryId as string,
    );

    ApiResponse.sendSuccess(
      res,
      200,
      "Notebook entry deleted successfully",
      notebook,
    );
  },
);

// ── Clear Entire Notebook ─────────────────────────────────

export const clearNotebook = asyncHandler(
  async (req: Request, res: Response) => {
    await clearNotebookService(req.user!._id as Types.ObjectId);

    ApiResponse.sendSuccess(res, 200, "Notebook cleared successfully", null);
  },
);
