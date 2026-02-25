import mongoose, { Schema } from "mongoose";
    import slugify from "slugify";
    import CustomError from "../../helpers/CustomError";
import { ISubscriptionPlan } from "./subscriptionplan.interface";


export type BillingInterval = "month" | "year";
export type PlanStatus = "active" | "inactive";

const subscriptionplanSchema = new Schema<ISubscriptionPlan>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "KRW",
    },

    interval: {
      type: String,
      enum: ["month", "year"],
      default: "month",
    },

    // Stripe internal reference (NOT from frontend)
    stripePriceId: {
      type: String,
      default: null,
    },

    limits: {
      swipePerDay: {
        type: Number,
        required: true,
        min: -1,
      },
      aiConversationsPerDay: {
        type: Number,
        required: true,
        min: -1,
      },
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Generate slug before save
subscriptionplanSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return;

  const category = await SubscriptionPlanModel.findOne({ title: this.title, isDeleted: false });
  if (category) {
    throw new CustomError(400, "SubscriptionPlan already exist");
  }

  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
    trim: true,
  });
});

// Generate slug on update
subscriptionplanSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;

  const category = await SubscriptionPlanModel.findOne({ title: update.title, isDeleted: false });
  if (category) {
    throw new CustomError(400, "SubscriptionPlan already exist");
  }

  if (update?.title) {
    update.slug = slugify(update.title, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

});

export const SubscriptionPlanModel = mongoose.model<ISubscriptionPlan>("SubscriptionPlan", subscriptionplanSchema);
