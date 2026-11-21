import { createHash, randomBytes } from "crypto";

export const hashRefreshToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const generateRefreshToken = () => {
  const token = randomBytes(64).toString("base64url");

  const tokenHash = hashRefreshToken(token);

  return {
    token,
    tokenHash,
  };
};