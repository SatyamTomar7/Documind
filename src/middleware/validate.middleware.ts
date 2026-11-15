import { Request, Response, NextFunction } from "express";
import { error } from "node:console";
import { treeifyError, z } from "zod";

export const validate = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        data: z.treeifyError(result.error),
      });
    }

    next();
  };
};