import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

import { db } from "../db";
import { refreshTokens, users } from "../db/schema";
import { ApiError } from "../utils/Apierror";
import { generateAccessToken } from "../utils/jwt";
import { generateRefreshToken } from "../utils/refreshtoken";

export const loginUser = async (
  email: string,
  password: string
) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = generateAccessToken(user.id);

  const {
    token: refreshToken,
    tokenHash,
  } = generateRefreshToken();

  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    accessToken,
    refreshToken,
  };
};

export const findUserByEmail = async (email: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  return user;
};

export const refreshAccessToken = async (
  refreshToken: string
) => {
  const tokenHash = createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const [storedToken] = await db
    .select({
      id: refreshTokens.id,
      userId: refreshTokens.userId,
      expiresAt: refreshTokens.expiresAt,
      revokedAt: refreshTokens.revokedAt,
    })
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash));

  if (!storedToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (
    storedToken.revokedAt ||
    storedToken.expiresAt.getTime() <= Date.now()
  ) {
    throw new ApiError(
      401,
      "Refresh token expired or revoked"
    );
  }

  const [user] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.id, storedToken.userId));

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const newAccessToken = generateAccessToken(user.id);

  const {
    token: newRefreshToken,
    tokenHash: newRefreshTokenHash,
  } = generateRefreshToken();

  const newExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  await db.transaction(async (tx) => {
    await tx
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
        replacedByTokenHash: newRefreshTokenHash,
      })
      .where(eq(refreshTokens.id, storedToken.id));

    await tx.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: newRefreshTokenHash,
      expiresAt: newExpiresAt,
    });
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};