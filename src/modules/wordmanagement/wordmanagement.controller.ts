import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateWordmanagement } from "./wordmanagement.interface";
import { wordmanagementService } from "./wordmanagement.service";

//: customize as needed
export const createWordmanagement = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateWordmanagement = req.body;
  const item = await wordmanagementService.createWordmanagement(data);
  ApiResponse.sendSuccess(res, 200, "Wordmanagement created", item);
});

//: get all wordmanagements
export const getAllWordmanagements = asyncHandler(async (req: Request, res: Response) => {
  const { wordmanagements, meta } = await wordmanagementService.getAllWordmanagements(req);
  ApiResponse.sendSuccess(res, 200, "Wordmanagements fetched", wordmanagements, meta);
});

//: get single wordmanagement by wordmanagementId
export const getWordmanagementById = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req?.user as { role: string };

  const wordmanagementId = req.params.wordmanagementId as string;
  if (!wordmanagementId) throw new Error("WordmanagementId not found");
  const wordmanagement = await wordmanagementService.getWordmanagementById(role as string, wordmanagementId as string);
  ApiResponse.sendSuccess(res, 200, "Wordmanagement fetched", wordmanagement);
});

//: bulk upload
export const bulkUpload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new Error("Please upload a CSV file");
  }

  const result = await wordmanagementService.bulkUpload(req.file.path);

  ApiResponse.sendSuccess(res, 200, result.message, result);
});

//: update wordmanagement by wordmanagementId
export const updateWordmanagement = asyncHandler(async (req: Request, res: Response) => {
  const wordmanagementId = req.params.wordmanagementId as string;
  if (!wordmanagementId) throw new Error("WordmanagementId not found");
  const data = req.body;
  const wordmanagement = await wordmanagementService.updateWordmanagement(wordmanagementId as string, data);
  ApiResponse.sendSuccess(res, 200, "Wordmanagement updated", wordmanagement);
})

//: delete wordmanagement by wordmanagementId
export const deleteWordmanagement = asyncHandler(async (req: Request, res: Response) => {
  const wordmanagementId = req.params.wordmanagementId as string;
  if (!wordmanagementId) throw new Error("WordmanagementId not found");
  const wordmanagement = await wordmanagementService.deleteWordmanagement(wordmanagementId as string);
  ApiResponse.sendSuccess(res, 200, "Wordmanagement deleted");
})