import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";
import { NotebookModel } from "./notebook.models";

// ── Get Full User Notebook ───────────────────────────────

export const getNotebookService = async (userId: Types.ObjectId) => {
  const notebook = await NotebookModel.findOne({ user: userId })
    .populate("entries.quiz", "title")
    .populate("entries.wordRef", "word description synonyms");

  if (!notebook || notebook.entries.length === 0)
    throw new CustomError(404, "Notebook is empty");

  return notebook;
};

// ── Get Wrong Answers By Specific Quiz ───────────────────

export const getNotebookByQuizService = async (
  userId: Types.ObjectId,
  quizId: string,
) => {
  if (!Types.ObjectId.isValid(quizId))
    throw new CustomError(400, "Invalid quiz id");

  const notebook = await NotebookModel.findOne({ user: userId });

  if (!notebook) throw new CustomError(404, "Notebook not found");

  const entries = notebook.entries.filter(
    (entry: any) => entry.quiz.toString() === quizId,
  );

  if (!entries.length)
    throw new CustomError(404, "No wrong answers found for this quiz");

  return entries;
};

// ── Delete Single Notebook Entry ─────────────────────────

export const deleteNotebookEntryService = async (
  userId: Types.ObjectId,
  entryId: string,
) => {
  if (!Types.ObjectId.isValid(entryId))
    throw new CustomError(400, "Invalid entry id");

  const notebook = await NotebookModel.findOneAndUpdate(
    { user: userId },
    { $pull: { entries: { _id: new Types.ObjectId(entryId) } } },
    { returnDocument: "after" },
  );

  if (!notebook) throw new CustomError(404, "Notebook not found");

  return notebook;
};

// ── Clear Entire Notebook ────────────────────────────────

export const clearNotebookService = async (userId: Types.ObjectId) => {
  const notebook = await NotebookModel.findOneAndUpdate(
    { user: userId },
    { $set: { entries: [] } },
    { returnDocument: "after" },
  );

  if (!notebook) throw new CustomError(404, "Notebook not found");

  return notebook;
};
