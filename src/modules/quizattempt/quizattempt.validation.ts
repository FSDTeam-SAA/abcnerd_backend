import { z } from "zod";

export const submitQuizValidation = z.object({
  body: z.object({
    answers: z
      .array(
        z.object({
          questionId: z.string({ message: "questionId is required" }),
          selectedAnswer: z.string({ message: "selectedAnswer is required" }),
        }),
      )
      .min(1, "At least one answer is required"),
  }),
});
