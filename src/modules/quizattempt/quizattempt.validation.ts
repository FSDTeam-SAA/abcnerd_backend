import { z } from "zod";

export const submitQuizValidation = z.object({
  body: z.object({
    answers: z
      .array(
        z.object({
          questionId: z.string({ message: "questionId দাও" }),
          selectedAnswer: z.string({ message: "selectedAnswer দাও" }),
        }),
      )
      .min(1, "কমপক্ষে ১টা answer দাও"),
  }),
});
