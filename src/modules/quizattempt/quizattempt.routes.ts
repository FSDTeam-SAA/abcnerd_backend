import { Router } from "express";
import { authGuard } from "../../middleware/auth.middleware";
import {
  getAllAttempts,
  getAttemptById,
  getAttemptHistory,
  getAttemptsByQuiz,
} from "./quizattempt.controller";
import { permission } from "../../middleware/permission.middleware";

const router = Router();

// ── User routes ──
router.get("/", authGuard, getAttemptHistory);
router.get("/:attemptId", authGuard, getAttemptById);

// ── Admin routes ──
router.get("/admin/all", authGuard, permission(["admin"]), getAllAttempts);
router.get(
  "/admin/quiz/:quizId",
  authGuard,
  permission(["admin"]),
  getAttemptsByQuiz,
);

export default router;
