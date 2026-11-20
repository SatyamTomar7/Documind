import { Request, Response } from "express";
import { ApiResponse } from "../utils/Apiresponse";
import { asyncHandler } from "../utils/AsyncHandler";
import {
  createDocument,
  getUserDocuments,
  getDocumentById,
  deleteDocument,
  getDocumentStatus,
} from "../services/document.services";
import { streamDocumentQuestion } from "../services/rag.services";
import { processDocument } from "../services/documentprocessing.services";
import {
  deleteUploadedFile,
  validateUploadedFileContent,
} from "../utils/file.utils";
export const createDocumentController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "Document file is required")
        );
      return;
    }

    const isValidContent = await validateUploadedFileContent(
      req.file.filename,
      req.file.mimetype,
    );

    if (!isValidContent) {
      await deleteUploadedFile(req.file.filename);
      res
        .status(400)
        .json(new ApiResponse(400, "Uploaded file content is invalid"));
      return;
    }

    const document = await createDocument(
      req.user!.id,
      req.file
    );

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "Document uploaded successfully",
          document
        )
      );
  }
);
export const getUserDocumentsController = asyncHandler(
  async (req: Request, res: Response) => {
    const documents = await getUserDocuments(req.user!.id);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Documents fetched successfully",
          documents
        )
      );
  }
);
export const getDocumentByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const documentId = Number(req.params.id);

    if (Number.isNaN(documentId)) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "Invalid document ID")
        );
      return;
    }

    const document = await getDocumentById(
      req.user!.id,
      documentId
    );

    if (!document) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "Document not found")
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Document fetched successfully",
          document
        )
      );
  }
);
export const deleteDocumentController = asyncHandler(
  async (req: Request, res: Response) => {
    const documentId = Number(req.params.id);

    if (Number.isNaN(documentId)) {
      res
        .status(400)
        .json(new ApiResponse(400, "Invalid document ID"));
      return;
    }

    const document = await deleteDocument(
      req.user!.id,
      documentId
    );

    if (!document) {
      res
        .status(404)
        .json(new ApiResponse(404, "Document not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Document deleted successfully",
          document
        )
      );
  }
);
export const processDocumentController = asyncHandler(
  async (req: Request, res: Response) => {
    const documentId = Number(req.params.id);

    if (Number.isNaN(documentId)) {
      res
        .status(400)
        .json(new ApiResponse(400, "Invalid document ID"));
      return;
    }

  const text = await processDocument(
  req.user!.id,
  documentId
);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Document processed successfully",
          { text }
        )
      );
  }
);
export const getDocumentStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const documentId = Number(req.params.id);

    if (Number.isNaN(documentId)) {
      res
        .status(400)
        .json(new ApiResponse(400, "Invalid document ID"));
      return;
    }

    const document = await getDocumentStatus(
      req.user!.id,
      documentId
    );

    if (!document) {
      res
        .status(404)
        .json(new ApiResponse(404, "Document not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Document status fetched successfully",
          document
        )
      );
  }
);
export const streamDocumentQuestionController = async (
  req: Request,
  res: Response
) => {
  const documentId = Number(req.params.id);
  const { question } = req.body;

  await getDocumentById(req.user!.id, documentId);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let disconnected = false;

  req.on("close", () => {
    disconnected = true;
  });

  try {
    const result = await streamDocumentQuestion(
      req.user!.id,
      documentId,
      question,
      (chunk) => {
        if (!disconnected) {
          res.write(
            `data: ${JSON.stringify({ chunk })}\n\n`
          );
        }
      }
    );

    if (!disconnected) {
      res.write(
        `data: ${JSON.stringify({
          type: "done",
          ...result,
        })}\n\n`
      );

      res.end();
    }
  } catch (error) {
    console.error("SSE stream failed:", error);

    if (!disconnected) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: "Streaming failed",
        })}\n\n`
      );

      res.end();
    }
  }
};