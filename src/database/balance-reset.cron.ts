import cron from "node-cron";
import { SubscriptionStatus } from "../modules/usersAuth/user.interface";
import { userModel } from "../modules/usersAuth/user.models";
import { SubscriptionModel } from "../modules/subscription/subscription.models";
import chalk from "chalk";

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
            "subscription.plan": null,
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

  cron.schedule(
    schedule,
    async () => {
      try {
        console.log(
          chalk.cyan(
            `[PingServer] Sending request at ${new Date().toISOString()}`,
          ),
        );

        const res = await fetch(
          "https://abcnerd-backend.onrender.com/api/v1/ping",
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        console.log(
          chalk.green(
            `[PingServer] Success | status=${res.status} | message=${data?.message ?? "ok"}`,
          ),
        );
      } catch (err) {
        console.error(chalk.red("[PingServer] Request failed:"), err);
      }
    },
    { timezone: "UTC" },
  );

  console.log(
    chalk.magenta("[PingServer] Cron scheduled — runs every 8 minutes"),
  );
};
