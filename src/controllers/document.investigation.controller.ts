import { Request, Response } from "express";
import { ApiResponse } from "../utils/Apiresponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { runDocumentInvestigation } from "../agents/documentInvestigation.agent";

export const documentInvestigationController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { goal } = req.body;

    if (typeof goal !== "string" || !goal.trim()) {
      res.status(400).json({
        success: false,
        message: "A valid investigation goal is required",
      });
      return;
    }

    const result = await runDocumentInvestigation({
      userId: req.user!.id,
      goal: goal.trim(),
    });

    res.status(200).json(
      new ApiResponse(
        200,
        "Document investigation completed successfully",
        result,
      ),
    );
  },
);