import express from "express";
import { getAllLeaderboardData } from "./leaderboard.controller";
import { authGuard } from "../../middleware/auth.middleware";

const router = express.Router();

// GET /leaderboard/all-data?page=1&limit=10
router.get("/all-data", authGuard as any, getAllLeaderboardData);

export default router;
