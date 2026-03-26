import cron from "node-cron";
import chalk from "chalk";
import { userModel } from "../modules/usersAuth/user.models";
import { Progress } from "../modules/progress/progress.models";
import { NotificationModel } from "../modules/notification/notification.models";
import { NotificationType } from "../modules/notification/notification.interface";

export const startNotificationCron = (): void => {
  // 1. Daily Cron Job (09:00 UTC)
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log(chalk.cyan(`[NotificationCron] Running daily at ${new Date().toISOString()}`));
      
      const allUsers = await userModel.find({ isDeleted: false }, "_id");

      for (const user of allUsers) {
        // A. Word Review Notifications
        const progress = await Progress.findOne({ user: user._id });
        if (progress && progress.reviewLater && progress.reviewLater.length > 0) {
          await NotificationModel.create({
            receiverId: user._id.toString(),
            title: "Word Review Time",
            description: `There are ${progress.reviewLater.length} words to review. Check them out now.`,
            type: NotificationType.WORD_REVIEW
          });
        }

        // B. AI Chat Mission Notification
        await NotificationModel.create({
          receiverId: user._id.toString(),
          title: "New Mission",
          description: "The AI chat mission has arrived.",
          type: NotificationType.AI_CHAT_MISSION
        });
      }

      console.log(chalk.green(`[NotificationCron] Daily notifications complete.`));
    } catch (err) {
      console.error(chalk.red("[NotificationCron] Daily job failed:"), err);
    }
  }, { timezone: "UTC" });

  // 2. Weekly Cron Job (Every Monday at 09:30 UTC)
  cron.schedule("30 9 * * 1", async () => {
    try {
      console.log(chalk.cyan(`[NotificationCron] Running weekly at ${new Date().toISOString()}`));
      
      const allUsers = await userModel.find({ isDeleted: false }, "_id");

      for (const user of allUsers) {
        // C. Weekly Quiz Notification
        await NotificationModel.create({
          receiverId: user._id.toString(),
          title: "New Quiz Available",
          description: "A new weekly quiz has been updated.",
          type: NotificationType.WEEKLY_QUIZ
        });
      }

      console.log(chalk.green(`[NotificationCron] Weekly notifications complete.`));
    } catch (err) {
      console.error(chalk.red("[NotificationCron] Weekly job failed:"), err);
    }
  }, { timezone: "UTC" });

  console.log(chalk.magenta(`[NotificationCron] Cron scheduled for App Notifications.`));
};
