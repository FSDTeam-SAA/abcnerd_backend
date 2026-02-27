import express from "express";
const router = express.Router();

import { userRoute } from "../modules/usersAuth/user.route";
import { categorywordRoute } from "../modules/categoryword/categoryword.routes";
import { wordmanagementRoute } from "../modules/wordmanagement/wordmanagement.routes";
import learningRoute from "../modules/learning/learning.routes";
import progressRoute from "../modules/progress/progress.routes";
import { subscriptionplanRoute } from "../modules/subscriptionplan/subscriptionplan.routes";
import { subscriptionRoute } from "../modules/subscription/subscription.routes";
import { notificationRoute } from "../modules/notification/notification.routes";

router.use("/user", userRoute);
router.use("/categoryword", categorywordRoute);
router.use("/wordmanagement", wordmanagementRoute);
router.use("/learning", learningRoute);
router.use("/progress", progressRoute);
router.use("/notification", notificationRoute);

//!Only payment routes are below
router.use("/subscriptionplan", subscriptionplanRoute);
router.use("/payment", subscriptionRoute);

export default router;
