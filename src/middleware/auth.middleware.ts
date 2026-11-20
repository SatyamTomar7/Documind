import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/Apierror";
import {
  verifyAccessToken,
  type AccessTokenPayload,
} from "../utils/jwt";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication required");
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  let payload: AccessTokenPayload;

  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  const [user] = await db
    .select({
      id: users.id,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, payload.userId));

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  req.user = {
    id: user.id,
    role: user.role,
  };

  next();
};