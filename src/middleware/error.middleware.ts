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

  if (error instanceof multer.MulterError) {
    const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file exceeds the 10 MB limit"
        : "File upload failed";

    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      data: null,
    });
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      statusCode: error.statusCode,
      message: error.message,
      data: null,
    });
    return;
  }

  const databaseError = getDatabaseApiError(error);

  if (databaseError) {
    res.status(databaseError.statusCode).json({
      success: false,
      statusCode: databaseError.statusCode,
      message: databaseError.message,
      data: null,
    });
    return;
  }

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal server error",
    data: null,
  });
};
