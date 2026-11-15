import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/Apierror";

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(error);

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      statusCode: error.statusCode,
      message: error.message,
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
