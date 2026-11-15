import { Request, Response } from "express";
import { ApiResponse } from "../utils/Apiresponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { runDocumentIntelligenceWorkflow } from "../workflows/document.workflow";

export const documentWorkflowController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await runDocumentIntelligenceWorkflow({
      userId: req.user!.id,
    });

    res.status(200).json(
      new ApiResponse(
        200,
        "Document workflow executed successfully",
        result,
      ),
    );
  },
);