import mongoose, { Schema, Types } from "mongoose";
import { ISubscription } from "./subscription.interface";

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    planId: {
      type: Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "active", "past_due", "canceled", "expired","failed"],
      default: "pending",
      index: true,
    },

    // billing cycle
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date }, // next billing date

    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date },

    // Stripe references
    stripeCustomerId: { type: String, index: true },
    stripeSubscriptionId: { type: String, index: true },
    stripeCheckoutSessionId: { type: String, index: true },

    // optional audit/debug
    latestInvoiceId: { type: String },
    latestPaymentIntentId: { type: String },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/**
 * ✅ One active subscription per user (recommended)
 * Note: partial unique index works on MongoDB replica set / Atlas.
 */
subscriptionSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active", isDeleted: false },
  }
);

// Ensure Stripe IDs not duplicated (optional but good)
subscriptionSchema.index(
  { stripeSubscriptionId: 1 },
  { unique: true, sparse: true }
);

subscriptionSchema.index(
  { stripeCheckoutSessionId: 1 },
  { unique: true, sparse: true }
);

export const SubscriptionModel = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema
);

// export const SubscriptionPlanModel = mongoose.model<ISubscriptionPlan>("SubscriptionPlan", subscriptionplanSchema);