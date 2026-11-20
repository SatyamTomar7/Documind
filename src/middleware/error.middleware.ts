import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ApiError } from "../utils/Apierror";
import { getDatabaseApiError } from "../utils/dberror";

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(error);

  if (res.headersSent) {
    next(error);
    return;
  }

  const sendError = (statusCode: number, message: string) => {
    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      data: null,
    });
  };

  if (error instanceof multer.MulterError) {
    const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file exceeds the 10 MB limit"
        : "File upload failed";

    sendError(statusCode, message);
    return;
  }

  if (error instanceof ApiError) {
    sendError(error.statusCode, error.message);
    return;
  }

  const databaseError = getDatabaseApiError(error);

  if (databaseError) {
    sendError(databaseError.statusCode, databaseError.message);
    return;
  }

  if (
    error instanceof SyntaxError &&
    typeof error === "object" &&
    error !== null &&
    "body" in error
  ) {
    sendError(400, "Malformed JSON request body");
    return;
  }

  sendError(500, "Internal server error");
};
