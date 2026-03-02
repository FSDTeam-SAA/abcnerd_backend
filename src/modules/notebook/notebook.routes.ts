import { Router } from "express";
import {
  getNotebook,
  getNotebookByQuiz,
  deleteNotebookEntry,
  clearNotebook,
} from "./notebook.controller";
import { authGuard } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authGuard, getNotebook);
router.get("/quiz/:quizId", authGuard, getNotebookByQuiz);
router.delete("/entry/:entryId", authGuard, deleteNotebookEntry);
router.delete("/clear", authGuard, clearNotebook);

const notebookRoute = router;
export default notebookRoute;
