import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateWordmanagement } from "./wordmanagement.interface";
import { wordmanagementService } from "./wordmanagement.service";

//TODO: customize as needed
export const createWordmanagement = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateWordmanagement = req.body;
  const item = await wordmanagementService.createWordmanagement(data);
  ApiResponse.sendSuccess(res, 200, "Wordmanagement created", item);
});
