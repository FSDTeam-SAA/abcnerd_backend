import { Router } from "express";
import {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  getActiveQuizzes,
  startQuiz,
  submitQuiz,
  getAttemptHistory,
  getNotebook,
} from "./quiz.controller";
import { authGuard } from "../../middleware/auth.middleware";
import { permission } from "../../middleware/permission.middleware";

const router = Router();

// ── Admin routes ──
router.post(
  "/",
  authGuard,
  permission(["admin"]),
  //   validateRequest(createQuizValidation),
  createQuiz,
);
router.get("/admin/all", authGuard, permission(["admin"]), getAllQuizzes);
router.get("/admin/:id", authGuard, permission(["admin"]), getQuizById);
router.patch("/:id", authGuard, permission(["admin"]), updateQuiz);
router.delete("/:id", authGuard, permission(["admin"]), deleteQuiz);

// ── User routes ──
router.get("/", authGuard, getActiveQuizzes);
router.get("/start/:id", authGuard, startQuiz);
router.post(
  "/submit/:id",
  authGuard,
  //   validateRequest(submitQuizValidation),
  submitQuiz,
);
router.get("/history/attempts", authGuard, getAttemptHistory);
router.get("/notebook", authGuard, getNotebook);

export default router;
