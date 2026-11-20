import { ApiError } from "./Apierror";

type DatabaseError = {
  code?: string;
  constraint?: string;
};

type DrizzleDatabaseError = {
  cause?: DatabaseError;
};

export const getDatabaseApiError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return null;
  }

  const dbError = error as DatabaseError & DrizzleDatabaseError;
  const cause = dbError.cause ?? dbError;

  switch (cause.code) {
    case "23505":
      return new ApiError(
        409,
        cause.constraint === "users_email_unique"
          ? "Email already exists"
          : "Resource already exists",
      );
    case "23503":
      return new ApiError(400, "Referenced resource does not exist");
    case "22P02":
      return new ApiError(400, "Invalid database value");
    case "23502":
      return new ApiError(400, "Missing required database value");
    default:
      return null;
  }
};

export const handleDatabaseError = (error: unknown): never => {
  const apiError = getDatabaseApiError(error);

  if (apiError) {
    throw apiError;
  }

  throw error;
};