import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth";

export type AccessTokenPayload = {
  userId: number;
};

export const isValidAccessTokenPayload = (
  payload: unknown,
): payload is AccessTokenPayload => {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "userId" in payload &&
    typeof payload.userId === "number" &&
    Number.isInteger(payload.userId) &&
    payload.userId > 0
  );
};

export const generateAccessToken = (userId: number) => {
  return jwt.sign(
    { userId },
    authConfig.jwtSecret,
    {
      expiresIn: authConfig.jwtExpiresIn,
    }
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(
    token,
    authConfig.jwtSecret
  );

  if (!isValidAccessTokenPayload(payload)) {
    throw new Error("Invalid access token payload");
  }

  return {
    userId: payload.userId,
  };
};