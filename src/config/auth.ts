import type { SignOptions } from "jsonwebtoken";
import env from "./env";

type AuthConfig = {
  jwtSecret: string;
  jwtExpiresIn: NonNullable<SignOptions["expiresIn"]>;
};

export const authConfig: AuthConfig = {
  jwtSecret: env.jwtSecret,
  jwtExpiresIn: "15m",
};
