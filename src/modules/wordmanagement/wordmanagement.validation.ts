import { z } from "zod";
import mongoose from "mongoose";

//create word wordmanagement
export const createWordmanagementSchema = z
  .object({
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

    pronunciation: z
      .string()
      .min(1, "Pronunciation cannot be empty")
      .max(100, "Pronunciation cannot exceed 100 characters")
      .transform((val) => val.trim())
      .optional(),

    examples: z
      .array(
        z
          .string()
          .min(1, "Example cannot be empty")
          .max(300, "Example cannot exceed 300 characters")
          .transform((v) => v.trim())
      )
      .max(20, "Examples cannot exceed 20 items")
      .optional(),

    status: z.enum(["active", "inactive"]).optional().default("active"),

    synonyms: z
      .array(z.string().min(1).max(50).transform((v) => v.trim()))
      .optional()
      .transform((arr) =>
        arr ? Array.from(new Set(arr.map((s) => s.toLowerCase()))) : arr
      ),

    categoryWordId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
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

    tags: z
      .array(z.string().min(1).max(30))
      .optional()
      .transform((tags) =>
        tags ? Array.from(new Set(tags.map((t) => t.trim().toLowerCase()))) : tags
      ),

    frequency: z
      .number()
      .int("Frequency must be an integer")
      .nonnegative("Frequency cannot be negative")
      .optional(),
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

    pronunciation: z
      .string()
      .min(1, "Pronunciation cannot be empty")
      .max(100, "Pronunciation cannot exceed 100 characters")
      .transform((val) => val.trim())
      .optional(),

    examples: z
      .array(
        z
          .string()
          .min(1, "Example cannot be empty")
          .max(300, "Example cannot exceed 300 characters")
          .transform((v) => v.trim())
      )
      .max(20, "Examples cannot exceed 20 items")
      .optional(),

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

    frequency: z
      .number()
      .int("Frequency must be an integer")
      .nonnegative("Frequency cannot be negative")
      .optional(),

    tags: z
      .array(z.string().min(1).max(30))
      .optional()
      .transform((tags) =>
        tags
          ? Array.from(new Set(tags.map((t) => t.trim().toLowerCase())))
          : tags
      ),

    status: z.enum(["active", "inactive"]).optional(),
  })
  .strict()