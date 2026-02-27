import { Types } from "mongoose";

export type SubscriptionStatus =
  | "pending"     // checkout created, not paid yet
  | "active"
  | "past_due"
  | "canceled"
  | "expired"
  | "failed";     // payment failed (optional but useful for tracking)

export interface ISubscription {
  _id: string;

  // relations
  userId: Types.ObjectId;
  planId: Types.ObjectId;

  // state
  status: SubscriptionStatus;
  isDeleted: boolean;

  // billing cycle
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;

  // Stripe references
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeCheckoutSessionId?: string;

  // optional audit/debug
  latestInvoiceId?: string;
  latestPaymentIntentId?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSubscription {
  userId: Types.ObjectId;
  planId: Types.ObjectId;

  status?: SubscriptionStatus;

  stripeCustomerId?: string;
  stripeCheckoutSessionId?: string;
}