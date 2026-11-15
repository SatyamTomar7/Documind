import { Request, Response } from "express";
import { createUser } from "../services/user.services";
import { ApiResponse } from "../utils/Apiresponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { getUserById } from "../services/user.services";
export const createUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await createUser(
      req.body.name,
      req.body.email,
      req.body.password,
    );

    res
      .status(201)
      .json(new ApiResponse(201, "User created successfully", user));
  },
);
export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await getUserById(req.user!.id);

    res
      .status(200)
      .json(new ApiResponse(200, "User fetched successfully", user));
  }
);