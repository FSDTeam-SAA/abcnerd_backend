import { Router } from "express";
import { authGuard } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { submitQuizValidation } from "./quizattempt.validation";
import {
  getAllAttemptsAdmin,
  getAttemptById,
  getAttemptHistory,
  getAttemptsByQuizAdmin,
  submitQuiz,
} from "./quizattempt.controller";
import { permission } from "../../middleware/permission.middleware";

const router = Router();

// User
router.post(
  "/submit/:quizId",
  authGuard,
  // validateRequest(submitQuizValidation),
  submitQuiz,
);
router.get("/history", authGuard, getAttemptHistory);
router.get("/history/:attemptId", authGuard, getAttemptById);

// Admin
router.get("/admin/all", authGuard, permission(["admin"]), getAllAttemptsAdmin);
router.get(
  "/admin/quiz/:quizId",
  authGuard,
  permission(["admin"]),
  getAttemptsByQuizAdmin,
);
const quizattemptRoute = router;
export default quizattemptRoute;
