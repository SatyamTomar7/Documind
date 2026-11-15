import { asyncHandler } from "../utils/AsyncHandler";
export const healthCheck = asyncHandler(async (req, res) => {
  // any async operation
  res.status(200).json({
    success: true,
    message: "DocuMind API is running",
  });
});