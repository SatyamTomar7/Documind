import { createHash, randomBytes } from "crypto";

export const generateRefreshToken = () => {
  const token = randomBytes(64).toString("base64url");

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  return {
    token,
    tokenHash,
  };
};