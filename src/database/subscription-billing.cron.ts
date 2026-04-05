import cron from "node-cron";
import { SubscriptionModel } from "../modules/subscription/subscription.models";
import { SubscriptionPlanModel } from "../modules/subscriptionplan/subscriptionplan.models";
import { tossPayments } from "../lib/tosspayments";
import { userModel } from "../modules/usersAuth/user.models";
import { InvoiceModel } from "../modules/invoice/invoice.models";
import { getIo } from "../socket/server";
import { NotificationModel } from "../modules/notification/notification.models";
import { NotificationStatus, NotificationType } from "../modules/notification/notification.interface";
import crypto from "crypto";

/**
 * Daily cron job to process recurring subscription payments.
 * Runs at midnight (00:00) every day.
 */
export const runSubscriptionBilling = async () => {
  console.log("[Cron] Checking for subscriptions due for billing...");

  const today = new Date();

  // Find subscriptions that are:
  // 1. Active
  // 2. Not deleted
  // 3. Expiring today or already expired
  // 4. Have a billing key
  const subscriptions = await SubscriptionModel.find({
    status: "active",
    isDeleted: false,
    tossBillingKey: { $exists: true, $ne: null },
    currentPeriodEnd: { $lte: today },
  }).populate("planId");

  console.log(`[Cron] Found ${subscriptions.length} subscriptions due for billing.`);

  for (const sub of subscriptions) {
    try {
      const plan = sub.planId as any;
      const orderId = `recurring_${crypto.randomBytes(8).toString("hex")}`;

      console.log(`[Cron] Charging subscription ${sub._id} for user ${sub.userId}`);

      // 1. Charge the billing key
      const payment = await tossPayments.chargeBillingKey({
        billingKey: sub.tossBillingKey!,
        customerKey: sub.tossCustomerKey!,
        orderId,
        amount: plan.price,
        orderName: `${plan.title} Plan Recurring Charge`,
      });

      // 2. Update subscription period
      sub.currentPeriodStart = new Date();
      const interval = plan.interval || "month";
      sub.currentPeriodEnd =
        interval === "year"
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await sub.save();

      // 3. Update user validity date
      await userModel.findByIdAndUpdate(sub.userId, {
        $set: { "balance.validityDate": sub.currentPeriodEnd },
      });

      // 4. Create invoice
      await InvoiceModel.create({
        title: `Recurring Invoice for ${plan.title}`,
        description: `Automatic recurring payment successful via Toss.`,
        userId: sub.userId,
        email: (payment as any).customerEmail || "Unknown",
        planName: plan.title,
        startDate: sub.currentPeriodStart,
        endDate: sub.currentPeriodEnd,
        status: "paid",
      });

      // 5. Notify via socket
      const io = getIo();
      io.to(String(sub.userId)).emit("payment:recurring_success", {
        message: "Your subscription has been automatically renewed.",
        nextBillingDate: sub.currentPeriodEnd,
      });

      // 6. Create Database Notification
      await NotificationModel.create({
        receiverId: String(sub.userId),
        title: "Subscription Renewed",
        description: `Your ${plan.title} subscription has been successfully renewed. Next billing date: ${sub.currentPeriodEnd.toLocaleDateString()}`,
        type: NotificationType.PAYMENT,
        status: NotificationStatus.UNREAD,
      });

      console.log(`[Cron] Successfully renewed subscription ${sub._id}`);
    } catch (error: any) {
      console.error(`[Cron] Failed to charge subscription ${sub._id}:`, error.response?.data || error.message);

      // If payment fails, mark as past_due
      sub.status = "past_due";
      await sub.save();

      // Notify user of failure
      const io = getIo();
      io.to(String(sub.userId)).emit("payment:failed", {
        message: "Automatic renewal failed. Please check your payment method.",
        subscriptionId: sub._id,
      });

      // Create Database Notification for failure
      const plan = sub.planId as any;
      await NotificationModel.create({
        receiverId: String(sub.userId),
        title: "Renewal Failed",
        description: `Automatic renewal for your ${plan?.title || "N/A"} subscription failed. Please check your payment method.`,
        type: NotificationType.PAYMENT,
        status: NotificationStatus.UNREAD,
      });
    }
  }
};

/**
 * Starts the subscription billing cron job.
 */
export const startSubscriptionBillingCron = () => {
  // Schedule it: Every day at midnight (00:00)
  cron.schedule("0 0 * * *", () => {
    runSubscriptionBilling().catch(err => console.error("[Cron] Billing Error:", err));
  });
  console.log("[Cron] Subscription billing job scheduled.");
};
