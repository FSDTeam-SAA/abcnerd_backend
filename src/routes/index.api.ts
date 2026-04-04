import express from "express";
const router = express.Router();

import { userRoute } from "../modules/usersAuth/user.route";
import { categorywordRoute } from "../modules/categoryword/categoryword.routes";
import { wordmanagementRoute } from "../modules/wordmanagement/wordmanagement.routes";
import learningRoute from "../modules/learning/learning.routes";
import progressRoute from "../modules/progress/progress.routes";
import { subscriptionplanRoute } from "../modules/subscriptionplan/subscriptionplan.routes";
import { subscriptionRoute } from "../modules/subscription/subscription.routes";
import quizRoute from "../modules/quiz/quiz.routes";
import quizattemptRoute from "../modules/quizattempt/quizattempt.routes";
import { notificationRoute } from "../modules/notification/notification.routes";
import { invoiceRoute } from "../modules/invoice/invoice.routes";
import notebookRoute from "../modules/notebook/notebook.routes";
import { chatbotRoute } from "../modules/chatbot/chatbot.routes";
import questionRoute from "../modules/question/question.routes";
import leaderboardRoute from "../modules/leaderboard/leaderboard.routes";
import { cronRoutes } from "../modules/cron/cron.routes";

router.use("/user", userRoute);
router.use("/categoryword", categorywordRoute);
router.use("/wordmanagement", wordmanagementRoute);
router.use("/learning", learningRoute);
router.use("/progress", progressRoute);
router.use("/notification", notificationRoute);
router.use("/invoice", invoiceRoute);
router.use("/chatbot", chatbotRoute);

//!Only payment routes are below
router.use("/subscriptionplan", subscriptionplanRoute);
router.use("/payment", subscriptionRoute);
router.use("/Quiz", quizRoute);
router.use("/quiz-attempt", quizattemptRoute);
router.use("/question", questionRoute);
router.use("/notebook", notebookRoute);
router.use("/leaderboard", leaderboardRoute);
router.use("/cron", cronRoutes);

export default router;
