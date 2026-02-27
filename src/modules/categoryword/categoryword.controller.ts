import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateCategoryWord } from "./categoryword.interface";
import { categorywordService } from "./categoryword.service";

//TODO: create categoryword
export const createCategoryWord = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const categoryword = await categorywordService.createCategoryWord(data);
  ApiResponse.sendSuccess(res, 200, "CategoryWord created", categoryword);
});

//TODO: get all categorywords
export const getAllCategoryWords = asyncHandler(async (req: Request, res: Response) => {
  const { categoryWords, meta } = await categorywordService.getAllCategoryWords(req);
  ApiResponse.sendSuccess(res, 200, "CategoryWords fetched", categoryWords, meta);
});

//TODO: get single categoryword by categorywordId
export const getCategoryWordById = asyncHandler(async (req: Request, res: Response) => {
  const categorywordId = req.params.categorywordId as string;
  if (!categorywordId) throw new Error("CategoryWordId not found");
  const categoryword = await categorywordService.getCategoryWordById(categorywordId as string);
  ApiResponse.sendSuccess(res, 200, "CategoryWord fetched", categoryword);
});

//TODO: update categoryword by categorywordId
export const updateCategoryWord = asyncHandler(async (req: Request, res: Response) => {
  const categorywordId = req.params.categorywordId as string;
  if (!categorywordId) throw new Error("CategoryWordId not found");
  const data = req.body;
  const categoryword = await categorywordService.updateCategoryWord(categorywordId as string, data);
  ApiResponse.sendSuccess(res, 200, "CategoryWord updated", categoryword);
});

//TODO: delete categoryword by categorywordId
export const deleteCategoryWord = asyncHandler(async (req: Request, res: Response) => {
  const categorywordId = req.params.categorywordId as string;
  if (!categorywordId) throw new Error("CategoryWordId not found in params");
  const categoryword = await categorywordService.deleteCategoryWord(categorywordId as string);
  ApiResponse.sendSuccess(res, 200, "CategoryWord deleted");
});