import rateLimit from "express-rate-limit";
import { ApiResponse } from "../utils/Apiresponse";

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    res
      .status(429)
      .json(
        new ApiResponse(
          429,
          "Too many login attempts. Please try again later."
        )
      );
  },
});
