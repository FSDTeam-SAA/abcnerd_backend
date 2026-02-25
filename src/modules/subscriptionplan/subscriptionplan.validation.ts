import { z } from "zod";

export const createSubscriptionPlanSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title cannot exceed 50 characters")
    .transform((val) => val.trim()),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .transform((val) => val?.trim()),

  // Backend controlled pricing
  price: z
    .number()
    .min(0, "Price cannot be negative"),

  currency: z
    .string()
    .length(3, "Currency must be 3 letters (ISO 4217)")
    .regex(/^[A-Z]{3}$/, "Currency must be uppercase ISO code (e.g., KRW, USD)")
    .default("KRW"),

  interval: z.enum(["month", "year"]).default("month"),

  // Stripe internal (admin only, not from public user)
  stripePriceId: z
    .string()
    .min(3, "Stripe price id required")
    .transform((val) => val.trim())
    .optional(), // make optional if you want to create plans before setting up Stripe

  // Limits
  limits: z.object({
    swipePerDay: z
      .number()
      .int()
      .min(-1, "Use -1 for unlimited")
      .default(0),

    aiConversationsPerDay: z
      .number()
      .int()
      .min(-1, "Use -1 for unlimited")
      .default(0),
  }),

  status: z.enum(["active", "inactive"]).default("active"),
}).strict();


export const updateSubscriptionPlanSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title cannot exceed 50 characters")
    .transform((val) => val.trim())
    .optional(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .transform((val) => val.trim())
    .optional(),

  price: z
    .number()
    .min(0, "Price cannot be negative")
    .optional(),

  currency: z
    .string()
    .length(3, "Currency must be 3 letters (ISO 4217)")
    .regex(/^[A-Z]{3}$/, "Currency must be uppercase ISO code (e.g., KRW, USD)")
    .optional(),

  interval: z
    .enum(["month", "year"])
    .optional(),

  stripePriceId: z
    .string()
    .min(3, "Stripe price id required")
    .transform((val) => val.trim())
    .optional(),

  limits: z
    .object({
      swipePerDay: z
        .number()
        .int()
        .min(-1, "Use -1 for unlimited")
        .optional(),

      aiConversationsPerDay: z
        .number()
        .int()
        .min(-1, "Use -1 for unlimited")
        .optional(),
    })
    .optional(),

  status: z
    .enum(["active", "inactive"])
    .optional(),
}).strict();