import { Router } from "express";
import {
  generateQuiz,
  getUserQuizHistory,
  getQuizById,
  getAllQuizzesAdmin,
  retakeQuizController,
} from "./quiz.controller";
import { authGuard } from "../../middleware/auth.middleware";
import { permission } from "../../middleware/permission.middleware";

const router = Router();

// User
router.post("/generate", authGuard, generateQuiz);
router.get("/history", authGuard, getUserQuizHistory);
router.get("/:quizId", authGuard, getQuizById);

// Admin
router.get("/admin/all", authGuard, permission(["admin"]), getAllQuizzesAdmin);

router.post("/retake/:quizId", authGuard, retakeQuizController);

const quizRoute = router;
export default quizRoute;
