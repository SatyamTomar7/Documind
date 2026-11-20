import { z } from "zod";

const conversationIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const createConversationSchema = z.object({
  body: z.object({
    documentId: z.coerce.number().int().positive(),
    title: z.string().trim().max(255).optional(),
  }),
});

export const getConversationSchema = z.object({
  params: conversationIdParams,
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    beforeId: z.coerce.number().int().positive().optional(),
  }),
});

export const conversationIdSchema = z.object({
  params: conversationIdParams,
});

export const messageSchema = z.object({
  params: conversationIdParams,
  body: z.object({
    content: z.string().trim().min(1),
  }),
});
