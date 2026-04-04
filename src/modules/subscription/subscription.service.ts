import mongoose, { Types } from "mongoose";
import CustomError from "../../helpers/CustomError";
import { SubscriptionModel } from "./subscription.models";
import config from "../../config";
import { SubscriptionPlanModel } from "../subscriptionplan/subscriptionplan.models";
import { stripe } from "../../lib/stripe";
import { userModel } from "../usersAuth/user.models";
import { InvoiceModel } from "../invoice/invoice.models";
import { getIo } from "../../socket/server";
import { createNotification } from "../notification/notification.controller";
import { NotificationModel } from "../notification/notification.models";
import { NotificationStatus, NotificationType } from "../notification/notification.interface";
import { paginationHelper } from "../../utils/pagination";


type CreateCheckoutPayload = {
  userId: Types.ObjectId | string;
  planId: Types.ObjectId | string;
  userEmail: string;
  stripeCustomerId?: string | null;
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
  const { userId, planId, userEmail, stripeCustomerId } = payload;

  if (!mongoose.Types.ObjectId.isValid(String(planId))) {
    throw new CustomError(400, "Invalid planId");
  }
  if (!mongoose.Types.ObjectId.isValid(String(userId))) {
    throw new CustomError(400, "Invalid userId");
  }
  if (!userEmail) {
    throw new CustomError(400, "User email is required");
  }

  const existingActive = await SubscriptionModel.findOne({
    userId,
    status: "active",
    isDeleted: false,
  })
    .populate("planId", "title price currency")
    .lean();

  if (existingActive) {
    throw new CustomError(
      409,
      `You already have an active subscription ${(existingActive as any).planId?.title || "Plan"}`
    );
  }

  const plan = await SubscriptionPlanModel.findOne({
    _id: String(planId),
    status: "active",
    isDeleted: false,
  }).lean();

  if (!plan) throw new CustomError(404, "Plan not found");

  if (!Number.isInteger(plan.price) || plan.price <= 0) {
    throw new CustomError(400, "Plan price is invalid");
  }

  const user = await userModel
    .findById(userId)
    .select("name address email")
    .lean();
  if (!user) throw new CustomError(404, "User not found");

  const currency = String(plan.currency || "KRW").trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) {
    throw new CustomError(400, "Invalid currency configured in plan");
  }

  const customerName = (user?.name || "").trim() || "Customer";
  let customerId = (stripeCustomerId || "").trim();

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      name: customerName,
      metadata: { userId: String(userId) },
    });
    customerId = customer.id;
  } else {
    await stripe.customers.update(customerId, {
      name: customerName,
      email: userEmail,
      metadata: { userId: String(userId) },
    });
  }

  const existingPending = await SubscriptionModel.findOne({
    userId,
    status: "pending",
    isDeleted: false,
  });

  let sub = existingPending;

  if (!sub) {
    sub = await SubscriptionModel.create({
      userId,
      planId: new Types.ObjectId(plan._id),
      status: "pending",
      stripeCustomerId: customerId,
      cancelAtPeriodEnd: false,
      isDeleted: false,
    });
  } else {
    sub.planId = new Types.ObjectId(plan._id);
    sub.stripeCustomerId = customerId;
    await sub.save();
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,

    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `${plan.title} Plan`,
            ...(plan.description ? { description: plan.description } : {}),
          },
          unit_amount: plan.price,
        },
        quantity: 1,
      },
    ],

    customer_update: { name: "auto", address: "auto" },

    custom_text: {
      submit: { message: `Paying as ${customerName}` },
    },

    success_url: `http://localhost:5000/api/v1/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/payment/cancel`,

    metadata: {
      userId: String(userId),
      subscriptionDocId: String(sub._id),
      planId: String(plan._id),
      type: "plan_payment",
    },
  });

  sub.stripeCheckoutSessionId = session.id;
  await sub.save();

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    subscriptionId: sub._id,
    stripeCustomerId: customerId,
    amount: plan.price,
    currency: currency.toUpperCase(),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Success payment (called from controller after redirect from Stripe Checkout)
// ─────────────────────────────────────────────────────────────────────────────
export const successPayment = async (sessionId: string) => {
  if (!sessionId) {
    throw new CustomError(400, "session_id is required");
  }

  const [session, lineItems] = await Promise.all([
    stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "payment_intent.payment_method", "customer"],
    }),
    stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 }),
  ]);

  if (!session) {
    throw new CustomError(404, "Stripe session not found");
  }

  if (session.payment_status !== "paid") {
    throw new CustomError(400, "Payment not completed");
  }

  const subscription = await SubscriptionModel.findOne({
    stripeCheckoutSessionId: sessionId,
    isDeleted: false,
    status: { $in: ["pending", "active"] },
  })
    .populate("planId", "title price currency interval credits")
    .exec();

  if (!subscription) {
    throw new CustomError(404, "Subscription not found for this session");
  }

  // Idempotent — return early if already active
  if (subscription.status === "active") {
    return {
      message: "Subscription already active",
      subscriptionId: subscription._id,
      stripe: {
        sessionId: session.id,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency?.toUpperCase(),
        customerName: session.customer_details?.name,
        customerEmail: session.customer_details?.email,
      },
      items: lineItems.data.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        amountTotal: li.amount_total,
        currency: li.currency,
        priceId: li.price?.id,
      })),
    };
  }

  // ── Activate subscription document ────────────────────────────────────────
  subscription.status = "active";
  subscription.currentPeriodStart = new Date();

  const interval =
    (subscription as any).planId?.interval ||
    (subscription as any).interval ||
    (subscription as any).billingInterval ||
    "month";

  subscription.currentPeriodEnd =
    interval === "year"
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  (subscription as any).stripePaymentStatus = session.payment_status;
  (subscription as any).stripeSessionStatus = session.status || null;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (paymentIntentId) {
    (subscription as any).stripePaymentIntentId = paymentIntentId;
  }
  if (session.customer_details?.email) {
    (subscription as any).customerEmail = session.customer_details.email;
  }
  if (session.customer_details?.name) {
    (subscription as any).customerName = session.customer_details.name;
  }

  await subscription.save();

  // ── Update user: balance + subscription block ──────────────────────────────
  const user = await userModel
    .findById(subscription.userId)
    .select("email name balance")
    .lean();

  if (user) {
    await userModel.findByIdAndUpdate(
      subscription.userId,
      buildUserActivationUpdate(
        (subscription as any).planId,
        user.balance,
        subscription.currentPeriodStart!,
        subscription.currentPeriodEnd!,
        subscription._id
      )
    );
  }

  // ── Create invoice ─────────────────────────────────────────────────────────
  const invoice = await InvoiceModel.create({
    title: `Invoice for ${(subscription as any).planId.title} Plan`,
    description: `Subscription activated for ${user?.name || "Customer"} (${user?.email || "Unknown email"
      }) on ${new Date().toLocaleDateString()}`,
    userId: subscription.userId,
    email: user?.email || session.customer_details?.email || "Unknown email",
    planName: (subscription as any).planId.title,
    startDate: subscription.currentPeriodStart,
    endDate: subscription.currentPeriodEnd,
    status: "paid",
    isDeleted: false,
  });

  (subscription as any).latestInvoiceId = invoice._id;
  await subscription.save();

  return {
    message: "Subscription activated successfully",
    subscriptionId: subscription._id,
    stripe: {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency?.toUpperCase(),
      customerName: session.customer_details?.name,
      customerEmail: session.customer_details?.email,
    },
    items: lineItems.data.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      amountTotal: li.amount_total,
      currency: li.currency,
      priceId: li.price?.id,
    })),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Failed / cancelled payment (cancel URL redirect)
// ─────────────────────────────────────────────────────────────────────────────
export const failedPayment = async (sessionId: string) => {
  if (!sessionId) {
    throw new CustomError(400, "session_id is required");
  }

  const subscription = await SubscriptionModel.findOne({
    stripeCheckoutSessionId: sessionId,
    isDeleted: false,
    status: "pending",
  });

  if (subscription) {
    subscription.status = "canceled";
    subscription.cancelAtPeriodEnd = false;
    await subscription.save();

    // Reflect canceled status on the user document
    await userModel.findByIdAndUpdate(subscription.userId, {
      $set: { "subscription.status": "canceled" },
    });
  }

  return {
    message: "Payment failed or was cancelled. Subscription not activated.",
    sessionId,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Create Payment Intent (custom card element flow)
// ─────────────────────────────────────────────────────────────────────────────
export const createPaymentIntent = async (payload: CreateCheckoutPayload) => {
  const { userId, planId, userEmail, stripeCustomerId } = payload;

  if (!mongoose.Types.ObjectId.isValid(String(planId))) {
    throw new CustomError(400, "Invalid planId");
  }
  if (!mongoose.Types.ObjectId.isValid(String(userId))) {
    throw new CustomError(400, "Invalid userId");
  }
  if (!userEmail) {
    throw new CustomError(400, "User email is required");
  }

  const existingActive = await SubscriptionModel.findOne({
    userId,
    status: "active",
    isDeleted: false,
  }).lean();

  if (existingActive) {
    throw new CustomError(
      409,
      `Already have an active subscription, ${(existingActive as any).planId?.title || "current Plan"
      } expires on ${new Date(
        (existingActive as any).currentPeriodEnd || 0
      ).toLocaleDateString()}`
    );
  }

  const plan = await SubscriptionPlanModel.findOne({
    _id: String(planId),
    status: "active",
    isDeleted: false,
  }).lean();

  if (!plan) throw new CustomError(404, "Plan not found");

  if (!Number.isInteger(plan.price) || plan.price <= 0) {
    throw new CustomError(400, "Plan price is invalid");
  }

  const currency = String(plan.currency || "KRW").trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) {
    throw new CustomError(400, "Invalid currency configured in plan");
  }

  let customerId = (stripeCustomerId || "").trim();

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      name: userEmail,
      metadata: { userId: String(userId) },
    });
    customerId = customer.id;
  } else {
    await stripe.customers.update(customerId, {
      email: userEmail,
      name: userEmail,
      metadata: { userId: String(userId) },
    });
  }

  let sub = await SubscriptionModel.findOne({
    userId,
    status: "pending",
    isDeleted: false,
  });

  if (!sub) {
    sub = await SubscriptionModel.create({
      userId,
      planId,
      status: "pending",
      stripeCustomerId: customerId,
      cancelAtPeriodEnd: false,
      isDeleted: false,
    });
  } else {
    sub.planId = planId as any;
    sub.stripeCustomerId = customerId;
    await sub.save();
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: plan.price,
    currency,
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    receipt_email: userEmail,
    metadata: {
      userId: String(userId),
      planId: String(planId),
      subscriptionId: String(sub._id),
      type: "plan_payment_intent",
    },
  });

  // findByIdAndUpdate avoids a race condition where Stripe fires the webhook
  // before sub.save() completes
  await SubscriptionModel.findByIdAndUpdate(sub._id, {
    stripePaymentIntentId: paymentIntent.id,
  });

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    subscriptionId: sub._id,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Stripe Webhook Handler
// ─────────────────────────────────────────────────────────────────────────────
export const handleStripeWebhook = async (req: any) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    throw new CustomError(400, "Missing Stripe signature");
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err) {
    throw new CustomError(
      400,
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }

  switch (event.type) {

    // ── Stripe Checkout flow ────────────────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object;

      if (session.payment_status === "paid") {
        // Await successPayment FIRST — only emit socket after DB is updated.
        // Previously the emit fired before successPayment(), so the frontend
        // could show success even if DB activation failed.
        await successPayment(session.id);

        const io = getIo();
        io.to(String(session.metadata?.userId)).emit("payment:success", {
          message: "Your subscription is now active!",
          subscriptionId: session.metadata?.subscriptionDocId,
          planId: session.metadata?.planId,
          stripeSessionId: session.id,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency?.toUpperCase() || "KRW",
        });

        const notif = await NotificationModel.create({
          receiverId: String(session.metadata?.userId),
          title: "Subscription Activated",
          description: "Your subscription is now active! Enjoy your premium features.",
          type: NotificationType.PAYMENT,
          status: NotificationStatus.UNREAD,
        });
        io.to(String(session.metadata?.userId)).emit("notification:new", notif);

        console.log(
          `[Webhook] checkout.session.completed — notified userId: ${session.metadata?.userId}`
        );
      }
      break;
    }

    // ── Custom card element flow (createPaymentIntent) ──────────────────────
    case "payment_intent.succeeded": {
      const pi = event.data.object;

      if (pi.metadata?.type !== "plan_payment_intent") break;

      const { subscriptionId, userId } = pi.metadata;
      if (!subscriptionId) {
        console.warn(
          `[Webhook] payment_intent.succeeded — no subscriptionId in metadata for PI: ${pi.id}`
        );
        break;
      }

      const sub = await SubscriptionModel.findOne({
        _id: subscriptionId,
        isDeleted: false,
        status: { $in: ["pending", "active"] },
      })
        .populate("planId", "title price currency interval credits")
        .exec();

      if (!sub) {
        console.warn(`[Webhook] Subscription not found: ${subscriptionId}`);
        break;
      }

      // Idempotent — skip if already active
      if (sub.status === "active") {
        console.log(`[Webhook] Subscription already active: ${sub._id}`);
        break;
      }

      // ── Activate subscription document ─────────────────────────────────────
      sub.status = "active";
      sub.currentPeriodStart = new Date();
      const interval =
        (sub as any).planId?.interval ||
        (sub as any).interval ||
        (sub as any).billingInterval ||
        "month";

      sub.currentPeriodEnd =
        interval === "year"
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      (sub as any).stripePaymentIntentId = pi.id;
      await sub.save();

      // ── Update user: balance + subscription block ──────────────────────────
      const user = await userModel
        .findById(sub.userId)
        .select("email name balance")
        .lean();

      if (user) {
        await userModel.findByIdAndUpdate(
          sub.userId,
          buildUserActivationUpdate(
            (sub as any).planId,
            user.balance,
            sub.currentPeriodStart!,
            sub.currentPeriodEnd!,
            sub._id
          )
        );
      }

      // ── Create invoice ─────────────────────────────────────────────────────
      const invoice = await InvoiceModel.create({
        title: `Invoice for ${(sub as any).planId.title} Plan`,
        description: `Subscription activated for ${user?.name || "Customer"
          } (${user?.email || "Unknown email"}) on ${new Date().toLocaleDateString()}`,
        userId: sub.userId,
        email: user?.email || pi.receipt_email || "Unknown email",
        planName: (sub as any).planId.title,
        startDate: sub.currentPeriodStart,
        endDate: sub.currentPeriodEnd,
        status: "paid",
        isDeleted: false,
      });

      (sub as any).latestInvoiceId = invoice._id;
      await sub.save();

      // ── Emit socket ────────────────────────────────────────────────────────
      const io = getIo();
      io.to(String(userId)).emit("payment:success", {
        message: "Your subscription is now active!",
        subscriptionId: sub._id,
        planId: (sub as any).planId._id,
        planName: (sub as any).planId.title,
        amount: pi.amount_received / 100,
        currency: pi.currency?.toUpperCase() || "KRW",
        stripePaymentIntentId: pi.id,
      });

      // ── Create notification ────────────────────────────────────────────────
      const notification = await NotificationModel.create({
        receiverId: String(userId),
        title: "Subscription Activated",
        description: `Your subscription is now active! Plan: ${(sub as any).planId.title || "N/A"
          }`,
        type: NotificationType.PAYMENT,
        status: NotificationStatus.UNREAD,
      });

      console.log(notification);
      console.log(
        `[Webhook] SUCCESS — subscription activated: ${sub._id}, notified userId: ${userId}`
      );
      break;
    }

    // ── Payment failed ──────────────────────────────────────────────────────
    case "payment_intent.payment_failed": {
      const pi = event.data.object;

      if (pi.metadata?.type !== "plan_payment_intent") break;

      const { subscriptionId, userId } = pi.metadata;
      if (!subscriptionId) break;

      // Mark subscription as failed
      await SubscriptionModel.findByIdAndUpdate(subscriptionId, {
        status: "failed",
        updatedAt: new Date(),
      });

      // Reflect failed status on the user document
      await userModel.findByIdAndUpdate(userId, {
        $set: { "subscription.status": "failed" },
      });

      const io = getIo();
      io.to(String(userId)).emit("payment:failed", {
        message: "Payment failed. Please try again.",
        subscriptionId,
        stripePaymentIntentId: pi.id,
      });

      const notif = await NotificationModel.create({
        receiverId: String(userId),
        title: "Payment Failed",
        description: "Your payment attempt failed. Please check your payment method and try again.",
        type: NotificationType.PAYMENT,
        status: NotificationStatus.UNREAD,
      });
      io.to(String(userId)).emit("notification:new", notif);

      console.log(
        `[Webhook] FAILED PaymentIntent: ${pi.id}, notified userId: ${userId}`
      );
      break;
    }

    default:
      console.log(`[Webhook] Unhandled event: ${event.type}`);
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
            stripeCustomerId: 1,
            stripeSubscriptionId: 1,
            currentPeriodStart: 1,
            currentPeriodEnd: 1,
            cancelAtPeriodEnd: 1,
            canceledAt: 1,
            latestInvoiceId: 1,
            stripeCheckoutSessionId: 1,
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
  handleStripeWebhook,
  failedPayment,
  getPaymentHistory,
  deletePaymentHistory,
};