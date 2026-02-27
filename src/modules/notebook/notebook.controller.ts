import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateNoteBook } from "./notebook.interface";
import { notebookService } from "./notebook.service";

//TODO: customize as needed
export const createNoteBook = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateNoteBook = req.body;
  const image = req.file as Express.Multer.File | undefined;
  const item = await notebookService.createNoteBook(data, image);
  ApiResponse.sendSuccess(res, 200, "NoteBook created", item);
});
