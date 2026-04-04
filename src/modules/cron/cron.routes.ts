import express from "express";
import { secureCronOrigin, triggerDailyBalanceReset, triggerDailyNotifications, triggerWeeklyNotifications } from "./cron.controller";

const router = express.Router();

router.use(secureCronOrigin);
router.get("/balance-reset", triggerDailyBalanceReset);
router.get("/daily-notifications", triggerDailyNotifications);
router.get("/weekly-notifications", triggerWeeklyNotifications);

export const cronRoutes = router;
