import cron from "node-cron";
import { SubscriptionStatus } from "../modules/usersAuth/user.interface";
import { userModel } from "../modules/usersAuth/user.models";
import { SubscriptionModel } from "../modules/subscription/subscription.models";
import chalk from "chalk";
import { NotificationModel } from "../modules/notification/notification.models";
import { NotificationType } from "../modules/notification/notification.interface";

// Daily balance reset logic:
const FREE_TIER = { wordSwipe: 10, aiChat: 5 } as const;

const utcStartOfTomorrow = (): Date => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
};

// Main function to reset balances daily at midnight UTC
export const resetDailyBalances = async (): Promise<void> => {
  const now = new Date();
  const tomorrowUTC = utcStartOfTomorrow();

  console.log(chalk.cyan(`[BalanceReset] Running at ${now.toISOString()}`));

  // Fetch all active subscriptions with their plans
  const activeSubscriptions = await SubscriptionModel.find({
    status: "active",
    isDeleted: false,
  })
    .populate("planId", "title credits status")
    .lean();

  console.log(
    chalk.cyan(
      `[BalanceReset] Active subscriptions found: ${activeSubscriptions.length}`,
    ),
  );

  // Update each active subscriber's balance based on their plan
  const subUpdateResults = await Promise.allSettled(
    activeSubscriptions.map(async (sub: any) => {
      const plan = sub.planId; // populated plan document

      if (!plan || plan.status !== "active") {
        console.warn(
          chalk.yellow(
            `[BalanceReset] Sub ${sub._id} has no valid plan — treating userId=${sub.userId} as free tier`,
          ),
        );
        await userModel.findByIdAndUpdate(sub.userId, {
          $set: {
            // balance
            "balance.wordSwipe": FREE_TIER.wordSwipe,
            "balance.aiChat": FREE_TIER.aiChat,
            "balance.validityDate": sub.currentPeriodEnd || tomorrowUTC,
            // subscription block
            "subscription.subscriptionId": String(sub._id),
            "subscription.plan": "Free",
            "subscription.status": SubscriptionStatus.ACTIVE,
            "subscription.startDate": sub.currentPeriodStart || now,
            "subscription.endDate": sub.currentPeriodEnd || tomorrowUTC,
            "subscription.lastResetDate": now,
          },
        });
        return;
      }

      const wordSwipe = plan.credits?.wordSwipe ?? FREE_TIER.wordSwipe;
      const aiChat = plan.credits?.aiChat ?? FREE_TIER.aiChat;

      await userModel.findByIdAndUpdate(sub.userId, {
        $set: {
          // balance
          "balance.wordSwipe": wordSwipe,
          "balance.aiChat": aiChat,
          "balance.validityDate": sub.currentPeriodEnd || tomorrowUTC,
          // subscription block
          "subscription.subscriptionId": String(sub._id),
          "subscription.plan": plan.title || null,
          "subscription.status": SubscriptionStatus.ACTIVE,
          "subscription.startDate": sub.currentPeriodStart || now,
          "subscription.endDate": sub.currentPeriodEnd || tomorrowUTC,
          "subscription.lastResetDate": now,
        },
      });

      console.log(
        chalk.green(
          `[BalanceReset] userId=${sub.userId} | plan="${plan.title}" | ` +
          `wordSwipe=${wordSwipe} aiChat=${aiChat}`,
        ),
      );
    }),
  );

  subUpdateResults.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[BalanceReset] Sub update[${i}] failed:`, r.reason);
    }
  });

  //  Handle users without active subscriptions (free-tier)
  const activeUserIds = activeSubscriptions.map((s: any) => s.userId);

  // Everyone else gets free-tier credits
  const freeTierResult = await userModel.updateMany(
    { _id: { $nin: activeUserIds } },
    {
      $set: {
        "balance.wordSwipe": FREE_TIER.wordSwipe,
        "balance.aiChat": FREE_TIER.aiChat,
        "balance.validityDate": tomorrowUTC,
        "subscription.lastResetDate": now,
      },
    },
  );

  console.log(
    chalk.green(
      `[BalanceReset] Free tier | ` +
      `Updated ${freeTierResult.modifiedCount} users | ` +
      `wordSwipe=${FREE_TIER.wordSwipe} aiChat=${FREE_TIER.aiChat}`,
    ),
  );

  // ── Step 4: Expire subscriptions whose currentPeriodEnd has passed ────────
  const expired = await SubscriptionModel.updateMany(
    { status: "active", currentPeriodEnd: { $lt: now } },
    { $set: { status: "expired" } },
  );

  if (expired.modifiedCount > 0) {
    console.log(
      chalk.yellow(
        `[BalanceReset] Expired ${expired.modifiedCount} subscriptions`,
      ),
    );
  }

  // ── Step 5: Expiration Reminders (7-day and 2-day) in Notification Tab ────────
  const notifyExpiringSubscriptions = async (days: 7 | 2) => {
    // We target the 24-hour window that lies exactly 'days' into the future
    const minTime = new Date(now.getTime() + (days - 1) * 24 * 60 * 60 * 1000);
    const maxTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const subsToNotify = await SubscriptionModel.find({
      status: "active",
      isDeleted: false,
      currentPeriodEnd: { $gt: minTime, $lte: maxTime }
    }).populate("userId", "name email").populate("planId", "title").exec();

    for (const sub of subsToNotify) {
      const user = sub.userId as any;
      const plan = sub.planId as any;
      if (!user) continue;

      try {
        // Create In-App Notification (Database only)
        await NotificationModel.create({
          receiverId: user._id.toString(),
          title: "Subscription Expiring Soon!",
          description: `Your ${plan?.title || 'premium'} subscription is ending in ${days} days.`,
          type: NotificationType.SUBSCRIPTION
        });

        console.log(chalk.green(`[BalanceReset] DB Notification (${days} days) created for ${user.email}`));
      } catch (err) {
        console.error(`[BalanceReset] Failed to notify sub ${sub._id}`, err);
      }
    }
  };

  await notifyExpiringSubscriptions(7);
  await notifyExpiringSubscriptions(2);

  console.log(chalk.cyan(`[BalanceReset] Done.`));
};

//balance reset cron scheduler
export const startBalanceResetCron = (): void => {
  const isDev = false;
  const schedule = isDev ? "* * * * *" : "0 0 * * *";
  const label = isDev ? "every 1 minute (DEV)" : "daily at 00:00 UTC";

  cron.schedule(
    schedule,
    async () => {
      try {
        await resetDailyBalances();
        console.log(
          chalk.green(
            `[BalanceReset] Completed at ${new Date().toISOString()}`,
          ),
        );
      } catch (err) {
        console.error(chalk.red("[BalanceReset] Cron job failed:"), err);
      }
    },
    { timezone: "UTC" },
  );

  console.log(chalk.magenta(`[BalanceReset] Cron scheduled — runs ${label}`));
};

//server pin in every 8 minutes
export const startPingServerCron = (): void => {
  const schedule = "*/8 * * * *"; // every 8 minutes

  const urls = [
    // "https://abcnerd-backend.onrender.com/api/v1/ping", // primary
    // "https://abcnerd-backend-v4we.onrender.com/api/v1/ping", // fallback
    "http://localhost:5600/api/v1/ping", // primary
  ];

  cron.schedule(
    schedule,
    async () => {
      console.log(
        chalk.cyan(
          `[PingServer] Start at ${new Date().toISOString()}`
        )
      );

      let success = false;

      for (const url of urls) {
        try {
          console.log(chalk.yellow(`[PingServer] Trying ${url}`));

          const res = await fetch(url);

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          const data = await res.json();

          console.log(
            chalk.green(
              `[PingServer] Success | url=${url} | status=${res.status} | message=${data?.message ?? "ok"}`
            )
          );

          success = true;
          break; // ✅ stop after first success
        } catch (err) {
          console.error(
            chalk.red(`[PingServer] Failed | url=${url}`),
            err
          );
        }
      }

      if (!success) {
        console.error(
          chalk.bgRed.white(
            `[PingServer] All endpoints failed!`
          )
        );
      }
    },
    { timezone: "UTC" }
  );

  console.log(
    chalk.magenta("[PingServer] Cron scheduled — runs every 8 minutes"),
  );
};
