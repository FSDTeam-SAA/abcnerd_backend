import { z } from "zod";
import mongoose from "mongoose";

//create word wordmanagement
export const createWordmanagementSchema = z.object({
  word: z
    .string()
    .min(3, "Word must be at least 3 characters")
    .max(50, "Word cannot exceed 50 characters")
    .transform((val) => val.trim()),

  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description cannot exceed 500 characters")
    .transform((val) => val.trim()),

  status: z
    .enum(["active", "inactive"])
    .optional()
    .default("active"),

  synonyms: z.array(z.string().min(1).max(50)).optional(),

  categoryWordId: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid categoryWordId, must be a valid ObjectId",
    }),

  wordType: z.string(),

  partOfSpeech: z
    .enum([
      "Noun",
      "Verb",
      "Adjective",
      "Adverb",
      "Pronoun",
      "Preposition",
      "Conjunction",
      "Interjection",
    ])
    .optional(),

  tags: z.array(z.string().min(1).max(30)).optional(),
})
  .strict();

  //update wordmanagement
export const updateWordmanagementSchema = z
  .object({
    word: z
      .string()
      .min(3, "Word must be at least 3 characters")
      .max(50, "Word cannot exceed 50 characters")
      .transform((val) => val.trim())
      .optional(),

    description: z
      .string()
      .min(1, "Description cannot be empty")
      .max(500, "Description cannot exceed 500 characters")
      .transform((val) => val.trim())
      .optional(),

    status: z.enum(["active", "inactive"]).optional(),

    synonyms: z
      .array(z.string().min(1).max(50).transform((v) => v.trim()))
      .optional(),

    categoryWordId: z
      .string()
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid categoryWordId, must be a valid ObjectId",
      })
      .optional(),

    wordType: z.string().optional(),

    partOfSpeech: z
      .enum([
        "Noun",
        "Verb",
        "Adjective",
        "Adverb",
        "Pronoun",
        "Preposition",
        "Conjunction",
        "Interjection",
      ])
      .optional(),

    tags: z
      .array(z.string().min(1).max(30))
      .optional()
      .transform((tags) =>
        tags
          ? Array.from(new Set(tags.map((t) => t.trim().toLowerCase())))
          : tags
      ),
  })
  .strict();