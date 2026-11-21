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

export const documentListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
