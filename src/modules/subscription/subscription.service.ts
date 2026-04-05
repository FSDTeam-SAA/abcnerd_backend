import mongoose, { Types } from "mongoose";
import CustomError from "../../helpers/CustomError";
import { SubscriptionModel } from "./subscription.models";
import config from "../../config";
import { SubscriptionPlanModel } from "../subscriptionplan/subscriptionplan.models";
import { tossPayments } from "../../lib/tosspayments";
import { userModel } from "../usersAuth/user.models";
import { InvoiceModel } from "../invoice/invoice.models";
import { getIo } from "../../socket/server";
import { createNotification } from "../notification/notification.controller";
import { NotificationModel } from "../notification/notification.models";
import { NotificationStatus, NotificationType } from "../notification/notification.interface";
import { paginationHelper } from "../../utils/pagination";
import crypto from "crypto";


type CreateCheckoutPayload = {
  userId: Types.ObjectId | string;
  planId: Types.ObjectId | string;
  userEmail: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build the $set payload that updates both balance and subscription
// fields on the user document after a successful payment.
//
// Maps to userSchema fields:
//   balance      → { wordSwipe, aiChat, validityDate }
//   subscription → { subscriptionId, plan, status, startDate, endDate, lastResetDate }
// ─────────────────────────────────────────────────────────────────────────────
function normalizePlan(title: string) {
  if (!title) return "Basic";

  const t = title.toLowerCase();

  if (t === "basic") return "Basic";
  if (t === "pro") return "Pro";
  if (t === "premium") return "Premium";
  if (t === "unlimited") return "Unlimited";

  return "Basic";
}

function buildUserActivationUpdate(
  planDoc: any,
  currentBalance: { wordSwipe?: number; aiChat?: number } | undefined,
  periodStart: Date,
  periodEnd: Date,
  subscriptionDocId: any
) {
  const set: Record<string, any> = {
    "subscription.subscriptionId": String(subscriptionDocId || null),
    "subscription.plan": normalizePlan(planDoc?.title),
    "subscription.status": "active",
    "subscription.startDate": periodStart,
    "subscription.endDate": periodEnd,
    "subscription.lastResetDate": new Date(),

    "balance.validityDate": periodEnd,
  };

  // wordSwipe
  if (planDoc?.credits?.wordSwipe !== undefined) {
    if (planDoc.credits.wordSwipe === -1) {
      set["balance.wordSwipe"] = -1;
    } else {
      const current =
        currentBalance?.wordSwipe === -1
          ? 0
          : currentBalance?.wordSwipe || 0;

      set["balance.wordSwipe"] =
        current + planDoc.credits.wordSwipe;
    }
  }

  // aiChat
  if (planDoc?.credits?.aiChat !== undefined) {
    if (planDoc.credits.aiChat === -1) {
      set["balance.aiChat"] = -1;
    } else {
      const current =
        currentBalance?.aiChat === -1
          ? 0
          : currentBalance?.aiChat || 0;

      set["balance.aiChat"] =
        current + planDoc.credits.aiChat;
    }
  }

  return { $set: set };
}

// ─────────────────────────────────────────────────────────────────────────────
// Create checkout session (called from controller)
// ─────────────────────────────────────────────────────────────────────────────
export const createCheckoutSession = async (payload: CreateCheckoutPayload) => {
  const { userId, planId, userEmail } = payload;

  if (!mongoose.Types.ObjectId.isValid(String(planId))) {
    throw new CustomError(400, "Invalid planId");
  }
  if (!mongoose.Types.ObjectId.isValid(String(userId))) {
    throw new CustomError(400, "Invalid userId");
  }
  if (!userEmail) {
    throw new CustomError(400, "User email is required");
  }

  const plan = await SubscriptionPlanModel.findOne({
    _id: String(planId),
    status: "active",
    isDeleted: false,
  }).lean();

  if (!plan) throw new CustomError(404, "Plan not found");

  const customerKey = `user_${userId}`;
  const orderId = crypto.randomBytes(10).toString("hex");

  // Upsert pending subscription
  let sub = await SubscriptionModel.findOne({
    userId,
    status: "pending",
    isDeleted: false,
  });

  if (!sub) {
    sub = await SubscriptionModel.create({
      userId,
      planId: new Types.ObjectId(plan._id),
      status: "pending",
      tossCustomerKey: customerKey,
    });
  } else {
    sub.planId = new Types.ObjectId(plan._id);
    sub.tossCustomerKey = customerKey;
    await sub.save();
  }

  return {
    clientKey: config.toss.clientKey,
    customerKey,
    orderId,
    amount: plan.price,
    orderName: `${plan.title} Plan`,
    subscriptionId: sub._id,
  };
};

/**
 * Internal helper to activate a subscription (idempotent).
 * Used by both successPayment redirect and Toss Webhook.
 */
async function activateSubscriptionInternal(subscription: any, tossPaymentDetails?: any) {
  // Idempotent: check if already active
  if (subscription.status === "active") {
    return {
      message: "Subscription already active",
      subscriptionId: subscription._id,
    };
  }

  const plan = subscription.planId as any;

  // 1. Activate Subscription record
  subscription.status = "active";
  if (tossPaymentDetails?.billingKey) {
    subscription.tossBillingKey = tossPaymentDetails.billingKey;
  }
  subscription.currentPeriodStart = new Date();

  const interval = plan.interval || "month";
  subscription.currentPeriodEnd =
    interval === "year"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await subscription.save();

  // 2. Update User Balance & Plan status
  const user = await userModel.findById(subscription.userId).select("balance name email").lean();
  if (user) {
    await userModel.findByIdAndUpdate(
      subscription.userId,
      buildUserActivationUpdate(
        plan,
        user.balance,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd,
        subscription._id
      )
    );
  }

  // 3. Create Invoice
  const invoice = await InvoiceModel.create({
    title: `Invoice for ${plan.title} Plan`,
    description: `Subscription activated via Toss for ${user?.name || "Customer"}`,
    userId: subscription.userId,
    email: user?.email || "Unknown",
    planName: plan.title,
    startDate: subscription.currentPeriodStart,
    endDate: subscription.currentPeriodEnd,
    status: "paid",
  });

  subscription.latestInvoiceId = invoice._id;
  await subscription.save();

  // 4. Emit Socket for real-time UI update
  const io = getIo();
  io.to(String(subscription.userId)).emit("payment:success", {
    message: "Your subscription is now active!",
    subscriptionId: subscription._id,
    planId: plan._id,
    amount: plan.price,
  });

  // 5. Create Database Notification
  await NotificationModel.create({
    receiverId: String(subscription.userId),
    title: "Subscription Activated",
    description: `Your ${plan.title} subscription is now active. Enjoy your premium features!`,
    type: NotificationType.PAYMENT,
    status: NotificationStatus.UNREAD,
  });

  return {
    message: "Subscription activated successfully",
    subscriptionId: subscription._id,
    payment: tossPaymentDetails,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Success payment (called from controller after redirect from Toss Checkout)
// ─────────────────────────────────────────────────────────────────────────────
export const successPayment = async (query: any) => {
  const { authKey, customerKey } = query;

  if (!authKey || !customerKey) {
    throw new CustomError(400, "authKey and customerKey are required");
  }

  // 1. Issue Billing Key from Toss
  const billingData = await tossPayments.issueBillingKey(authKey, customerKey);
  const { billingKey } = billingData as any;

  // 2. Find internal subscription
  const subscription = await SubscriptionModel.findOne({
    tossCustomerKey: customerKey,
    isDeleted: false,
    status: "pending",
  })
    .populate("planId")
    .exec();

  if (!subscription) {
    throw new CustomError(404, "Subscription not found");
  }

  const plan = subscription.planId as any;
  const orderId = `initial_${crypto.randomBytes(8).toString("hex")}`;

  // 3. Perform Initial Charge (First month/year)
  const payment = await tossPayments.chargeBillingKey({
    billingKey,
    customerKey,
    orderId,
    amount: plan.price,
    orderName: `${plan.title} Plan Initial Charge`,
  });

  // 4. Use shared activation helper
  return activateSubscriptionInternal(subscription, { ...(payment as any), billingKey });
};

// ─────────────────────────────────────────────────────────────────────────────
// Failed / cancelled payment (cancel URL redirect)
// ─────────────────────────────────────────────────────────────────────────────
export const failedPayment = async (query: any) => {
  const { customerKey } = query;
  if (customerKey) {
    await SubscriptionModel.findOneAndUpdate(
      { tossCustomerKey: customerKey, status: "pending" },
      { status: "failed" }
    );
  }
  return { message: "Payment failed or was cancelled." };
};

/**
 * For Toss, we don't necessarily need a separate "Payment Intent" for billing keys,
 * but for compatibility, we can return the necessary client keys.
 */
export const createPaymentIntent = async (payload: CreateCheckoutPayload) => {
  return createCheckoutSession(payload);
};

// ─────────────────────────────────────────────────────────────────────────────
// Toss Webhook Handler (with server-side verification)
// ─────────────────────────────────────────────────────────────────────────────
export const handleTossWebhook = async (req: any) => {
  const event = req.body;
  console.log("[Toss Webhook] Received event:", event.eventType);

  // 1. Handle Payment Status Changes
  if (event.eventType === "PAYMENT_STATUS_CHANGED") {
    const { paymentKey, status, orderId } = event.data;

    if (status === "DONE") {
      // ✅ SERVER VERIFICATION: Fetch payment details directly from Toss
      const verifiedPayment = await tossPayments.getPayment(paymentKey) as any;

      if (verifiedPayment.status === "DONE") {
        // Find subscription by customerKey (if available in metadata) or orderId
        // In this implementation, we mostly use customerKey = user_{userId}
        const subscription = await SubscriptionModel.findOne({
          tossCustomerKey: verifiedPayment.customerKey,
          status: "pending",
          isDeleted: false,
        })
          .populate("planId")
          .exec();

        if (subscription) {
          console.log(`[Toss Webhook] Activating subscription for order ${orderId} via webhook.`);
          await activateSubscriptionInternal(subscription, verifiedPayment);
        }
      }
    }
  }

  return { received: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin: Get Payment History with filters and search
// ─────────────────────────────────────────────────────────────────────────────
export const getPaymentHistory = async (query: any) => {
  const { page: qPage, limit: qLimit, search, status } = query;
  const { page, limit, skip } = paginationHelper(qPage, qLimit);

  const pipeline: any[] = [
    { $match: { isDeleted: false } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "subscriptionplans",
        localField: "planId",
        foreignField: "_id",
        as: "plan",
      },
    },
    { $unwind: "$plan" },
  ];

  // Filters
  const match: any = {};
  if (status && status !== "all") {
    match.status = status;
  }

  if (search) {
    match.$or = [
      { "user.name": { $regex: search, $options: "i" } },
      { "user.email": { $regex: search, $options: "i" } },
    ];
  }

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  // Pagination with Facets
  pipeline.push({
    $facet: {
      metadata: [{ $count: "total" }],
      data: [
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            userName: "$user.name",
            email: "$user.email",
            subscription: "$plan.title",
            status: 1,
            tossBillingKey: 1,
            tossCustomerKey: 1,
            currentPeriodStart: 1,
            currentPeriodEnd: 1,
            cancelAtPeriodEnd: 1,
            canceledAt: 1,
            latestInvoiceId: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ],
    },
  });

  const result = await SubscriptionModel.aggregate(pipeline);
  const data = result[0].data;
  const total = result[0].metadata[0]?.total || 0;
  const totalPage = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
  };
};

export const deletePaymentHistory = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new CustomError(400, "Invalid ID");
  }

  const result = await SubscriptionModel.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );

  if (!result) {
    throw new CustomError(404, "Payment history not found");
  }

  return result;
};

export const subscriptionService = {
  createCheckoutSession,
  successPayment,
  createPaymentIntent,
  handleTossWebhook,
  failedPayment,
  getPaymentHistory,
  deletePaymentHistory,
};