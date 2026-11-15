import { Request, Response } from "express";
import { loginUser } from "../services/auth.services";
import { ApiResponse } from "../utils/Apiresponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { refreshAccessToken } from "../services/auth.services"
export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await loginUser(
      req.body.email,
      req.body.password
    );

    res
      .status(200)
      .json(new ApiResponse(200, "Login successful", user));
  }
);
export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const result = await refreshAccessToken(refreshToken);

    res
      .status(200)
      .json(new ApiResponse(200, "Access token refreshed", result));
  }
);