import { ApiError } from "./Apierror";

type DatabaseError = {
  code?: string;
  constraint?: string;
};

type DrizzleDatabaseError = {
  cause?: DatabaseError;
};

export const handleDatabaseError = (error: unknown): never => {
  const dbError = error as DrizzleDatabaseError;

  if (
    dbError.cause?.code === "23505" &&
    dbError.cause?.constraint === "users_email_unique"
  ) {
    throw new ApiError(409, "Email already exists");
  }

  throw error;
};