import { z } from "zod";
import { CategoryWord } from "./categoryword.interface";
//TODO: customize as needed

export const createCategoryWordSchema = z.object({
  name: z.enum(Object.values(CategoryWord) as [string, ...string[]]),
  description: z
    .string()
    .max(500)
    .optional()
    .transform(val => val?.trim()),
  isActive: z.boolean().optional()
})
  .strict();


export const updateCategoryWordSchema = z.object({
  name: z.enum(Object.values(CategoryWord) as [string, ...string[]]).optional(),
  description: z
    .string()
    .max(500)
    .optional()
    .transform(val => val?.trim()),
  isActive: z.boolean().optional()
})
  .strict();

  