import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { leaderboardService } from "./leaderboard.service";
import { leaderboardQuerySchema } from "./leaderboard.validation";
import CustomError from "../../helpers/CustomError";

export const getAllLeaderboardData = asyncHandler(
  async (req: Request, res: Response) => {
    // Validate query parameters
    const queryValidation = leaderboardQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      throw new CustomError(400, queryValidation.error.issues[0]?.message || "Invalid query parameters");
    }
    const filter = queryValidation.data.filter;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const data = await leaderboardService.getAllLeaderboardData(page, limit, filter);

    ApiResponse.sendSuccess(res, 200, "Leaderboard data fetched successfully", data);
  }
);
