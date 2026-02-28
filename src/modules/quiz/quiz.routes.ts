import { Router } from "express";
import {
  createQuiz,
  getAllQuizzesAdmin,
  getQuizByIdAdmin,
  updateQuiz,
  deleteQuiz,
  toggleQuizStatus,
} from "./quiz.controller";
import { authGuard } from "../../middleware/auth.middleware";
import { permission } from "../../middleware/permission.middleware";

const router = Router();

router.post("/create-quiz", authGuard, permission(["admin"]), createQuiz);
router.get(
  "/get-all-quiz",
  authGuard,
  permission(["admin"]),
  getAllQuizzesAdmin,
);
router.get(
  "/get-single-quiz/:id",
  authGuard,
  permission(["admin"]),
  getQuizByIdAdmin,
);
router.patch("/update-quiz/:id", authGuard, permission(["admin"]), updateQuiz);
router.delete("/delete-quiz/:id", authGuard, permission(["admin"]), deleteQuiz);
router.patch(
  "/:id/toggle-status",
  authGuard,
  permission(["admin"]),
  toggleQuizStatus,
);

const quizRoute = router;
export default quizRoute;
