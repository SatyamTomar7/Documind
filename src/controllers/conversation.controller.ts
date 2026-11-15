import { Request, Response } from "express";
import { ApiError } from "../utils/Apierror";
import { asyncHandler } from "../utils/AsyncHandler";
import {
  createConversation,
  getUserConversations,
  getConversationById,
  getConversationMessages,
  deleteConversation,
  createMessage,
  sendMessage,
} from "../services/conversation.services";
export const createConversationController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user!.id;
  const { documentId, title } = req.body;

  const conversation = await createConversation(
    userId,
    Number(documentId),
    title,
  );

  res.status(201).json({
    success: true,
    data: conversation,
  });
};
export const getUserConversationsController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user!.id;

  const conversations = await getUserConversations(userId);

  res.status(200).json({
    success: true,
    data: conversations,
  });
};
export const getConversationController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const conversationId = Number(req.params.id);

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      throw new ApiError(400, "Invalid conversation ID");
    }

    const limitParam = req.query.limit;
    const beforeIdParam = req.query.beforeId;

    const limit = limitParam === undefined ? 20 : Number(limitParam);

    const beforeId =
      beforeIdParam === undefined ? undefined : Number(beforeIdParam);

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new ApiError(400, "Limit must be between 1 and 100");
    }

    if (
      beforeId !== undefined &&
      (!Number.isInteger(beforeId) || beforeId <= 0)
    ) {
      throw new ApiError(400, "Invalid beforeId");
    }

    const conversation = await getConversationById(userId, conversationId);

    const conversationMessages = await getConversationMessages(
      userId,
      conversationId,
      limit,
      beforeId,
    );
    const hasMore = conversationMessages.length === limit;
    res.status(200).json({
      success: true,
      data: {
        conversation,
        messages: conversationMessages,
        pagination: {
          limit,
          beforeId: beforeId ?? null,
          hasMore: conversationMessages.length === limit,
          nextBeforeId:
            hasMore && conversationMessages.length > 0
              ? (conversationMessages[conversationMessages.length - 1]?.id ??
                null)
              : null,
        },
      },
    });
  },
);
export const deleteConversationController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const conversationId = Number(req.params.id);

    await deleteConversation(userId, conversationId);

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  },
);
export const createMessageController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const conversationId = Number(req.params.id);
    const { content } = req.body;

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      throw new ApiError(400, "Invalid conversation ID");
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      throw new ApiError(400, "Message content is required");
    }

    const message = await createMessage(
      userId,
      conversationId,
      "user",
      content.trim(),
    );

    res.status(201).json({
      success: true,
      data: message,
    });
  },
);
export const sendMessageController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const conversationId = Number(req.params.id);
    const { content } = req.body;

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      throw new ApiError(400, "Invalid conversation ID");
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      throw new ApiError(400, "Message content is required");
    }

    const result = await sendMessage(userId, conversationId, content.trim());

    res.status(201).json({
      success: true,
      data: result,
    });
  },
);
