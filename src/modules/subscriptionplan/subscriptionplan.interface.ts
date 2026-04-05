// subscriptionPlan.interface.ts

export type PlanStatus = "active" | "inactive";

export type BillingInterval = "month" | "year";

export interface ISubscriptionPlan {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  price: number;
  currency: string;
  interval: BillingInterval;
  stripePriceId: string;
  stripeProductId?: string;
  credits: {
    wordSwipe: number;
    aiChat: number;
  };
  status: PlanStatus;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSubscriptionPlan {
  title: string;
  description?: string;
  slug: string;

  price: number;
  currency?: string;           // default "KRW"
  interval?: BillingInterval;

  stripePriceId: string;
  stripeProductId?: string;

  credits: {
    wordSwipe: number;
    aiChat: number;
  };

  status?: PlanStatus;
}