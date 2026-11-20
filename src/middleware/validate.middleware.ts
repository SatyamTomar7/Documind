import { Request, Response, NextFunction } from "express";
import { treeifyError, z } from "zod";
import { ApiResponse } from "../utils/Apiresponse";

export const validate = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "Validation failed",
            treeifyError(result.error),
          ),
        );
    }

    next();
  };
};