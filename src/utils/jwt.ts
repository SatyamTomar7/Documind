import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth";

type JwtPayload = {
  userId: number;
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

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(
    token,
    authConfig.jwtSecret
  ) as JwtPayload;
};