import { Request, Response } from "express";
import { resetDailyBalances } from "../../database/balance-reset.cron";
import { runDailyNotifications, runWeeklyNotifications } from "../../database/notification.cron";

// Optional: Validate Vercel cron secret to secure endpoints
export const secureCronOrigin = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (process.env.VERCEL && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  }
  next();
};

export const triggerDailyBalanceReset = async (req: Request, res: Response) => {
  try {
    await resetDailyBalances();
    res.status(200).json({ success: true, message: "Daily balance reset completed." });
  } catch (error) {
    console.error("Cron Error (Daily Balance):", error);
    res.status(500).json({ success: false, message: "Cron failed", error });
  }
};

export const triggerDailyNotifications = async (req: Request, res: Response) => {
  try {
    await runDailyNotifications();
    res.status(200).json({ success: true, message: "Daily notifications triggered." });
  } catch (error) {
    console.error("Cron Error (Daily Notifications):", error);
    res.status(500).json({ success: false, message: "Cron failed", error });
  }
};

export const triggerWeeklyNotifications = async (req: Request, res: Response) => {
  try {
    await runWeeklyNotifications();
    res.status(200).json({ success: true, message: "Weekly notifications triggered." });
  } catch (error) {
    console.error("Cron Error (Weekly Notifications):", error);
    res.status(500).json({ success: false, message: "Cron failed", error });
  }
};
