import { db } from "../db";
import { refreshTokens } from "../db/schema";
import { generateRefreshToken } from "../utils/refreshtoken";

export const createRefreshToken = async (userId: number) => {
  const { token, tokenHash } = generateRefreshToken();

  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return {
    token,
    expiresAt,
  };
};