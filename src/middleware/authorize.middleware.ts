import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/Apierror";

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "Forbidden");
    }

    next();
  };
};