import { z } from "zod";

export const documentIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const streamQuestionSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    question: z
      .string()
      .trim()
      .min(1)
      .max(10_000, "Question must be 10000 characters or fewer"),
  }),
});
