import { Router } from "express";
import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  toggleQuestionStatus,
} from "./question.controller";
import { authGuard } from "../../middleware/auth.middleware";
import { permission } from "../../middleware/permission.middleware";

const router = Router();

router.post("/", authGuard, permission(["admin"]), createQuestion);
router.get("/", authGuard, permission(["admin"]), getAllQuestions);
router.get("/:id", authGuard, permission(["admin"]), getQuestionById);
router.patch("/:id", authGuard, permission(["admin"]), updateQuestion);
router.delete("/:id", authGuard, permission(["admin"]), deleteQuestion);
router.patch(
  "/:id/toggle-status",
  authGuard,
  permission(["admin"]),
  toggleQuestionStatus,
);
const questionRoute = router;
export default questionRoute;
