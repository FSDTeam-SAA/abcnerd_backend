import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";
import { NotebookModel } from "./notebook.models";

// ── User এর পুরো notebook ──
export const getNotebookService = async (userId: Types.ObjectId) => {
  const notebook = await NotebookModel.findOne({ user: userId }).populate(
    "entries.wordRef",
    "word description synonyms",
  );

  if (!notebook || notebook.entries.length === 0)
    throw new CustomError(404, "Notebook এ কিছু নেই");

  return notebook;
};

// ── একটা specific quiz এর wrong answers ──
export const getNotebookByQuizService = async (
  userId: Types.ObjectId,
  quizId: string,
) => {
  const notebook = await NotebookModel.findOne({ user: userId });
  if (!notebook) throw new CustomError(404, "Notebook পাওয়া যায়নি");

  const entries = notebook.entries.filter(
    (entry) => entry.quiz.toString() === quizId,
  );

  if (!entries.length)
    throw new CustomError(404, "এই quiz এর কোনো wrong answer নেই");

  return entries;
};

// ── Notebook থেকে একটা entry delete ──
export const deleteNotebookEntryService = async (
  userId: Types.ObjectId,
  entryId: string,
) => {
  const notebook = await NotebookModel.findOneAndUpdate(
    { user: userId },
    { $pull: { entries: { _id: new Types.ObjectId(entryId) } } },
    { new: true },
  );

  if (!notebook) throw new CustomError(404, "Notebook পাওয়া যায়নি");
  return notebook;
};

// ── Notebook সম্পূর্ণ clear ──
export const clearNotebookService = async (userId: Types.ObjectId) => {
  const notebook = await NotebookModel.findOneAndUpdate(
    { user: userId },
    { $set: { entries: [] } },
    { new: true },
  );

  if (!notebook) throw new CustomError(404, "Notebook পাওয়া যায়নি");
  return notebook;
};
