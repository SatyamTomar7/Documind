import { z } from "zod";

export const documentIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
