import { eq, and, lt, desc ,or} from "drizzle-orm";
import { db } from "../db";
import { conversations, messages } from "../db/schema";
import { ApiError } from "../utils/Apierror";
import { answerDocumentQuestion } from "./rag.services";
import { getDocumentById } from "./document.services";
export const createConversation = async (
  userId: number,
  documentId: number,
  title?: string
) => {
  const document = await getDocumentById(userId, documentId);

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  const [conversation] = await db
    .insert(conversations)
    .values({
      userId,
      documentId,
      title: title?.trim() || "New Conversation",
    })
    .returning();

  return conversation;
};

export const getUserConversations = async (
  userId: number
) => {
  return await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
};

export const getConversationById = async (
  userId: number,
  conversationId: number
) => {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    )
    .limit(1);

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  return conversation;
};

export const getConversationMessages = async (
  userId: number,
  conversationId: number,
  limit: number = 20,
  beforeId?: number
) => {
  await getConversationById(userId, conversationId);

  const conditions = beforeId
    ? and(
        eq(messages.conversationId, conversationId),
        lt(messages.id, beforeId)
      )
    : eq(messages.conversationId, conversationId);

  return await db
    .select()
    .from(messages)
    .where(conditions)
    .orderBy(desc(messages.id))
    .limit(limit);
};
export const getRecentConversationHistory = async (
  userId: number,
  conversationId: number,
  beforeMessageId: number,
  limit: number = 10
) => {
  await getConversationById(userId, conversationId);

  const history = await db
    .select({
      role: messages.role,
      content: messages.content,
    })
    .from(messages)
.where(
  and(
    eq(messages.conversationId, conversationId),
    lt(messages.id, beforeMessageId),
    or(
      eq(messages.role, "user"),
      and(
        eq(messages.role, "assistant"),
        eq(messages.status, "completed")
      )
    )
  )
)
    .orderBy(desc(messages.id))
    .limit(limit);

return history.reverse().map((message) => {
  if (
    message.role !== "user" &&
    message.role !== "assistant"
  ) {
    throw new Error("Invalid conversation message role");
  }

  return {
    role: message.role as "user" | "assistant",
    content: message.content,
  };
});
};
export const deleteConversation = async (
  userId: number,
  conversationId: number
) => {
  const conversation = await getConversationById(
    userId,
    conversationId
  );

  await db
    .delete(conversations)
    .where(eq(conversations.id, conversation.id));

  return conversation;
};
export const createMessage = async (
  userId: number,
  conversationId: number,
  role: string,
  content: string
) => {
  await getConversationById(userId, conversationId);

  const [message] = await db
    .insert(messages)
    .values({
      conversationId,
      role,
      content,
    })
    .returning();
await db
  .update(conversations)
  .set({ updatedAt: new Date() })
  .where(eq(conversations.id, conversationId));
  return message;
};
export const sendMessage = async (
  userId: number,
  conversationId: number,
  content: string
) => {
  const conversation = await getConversationById(
    userId,
    conversationId
  );

  const [userMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      role: "user",
      content,
      status: "completed",
    })
    .returning();
    if (!userMessage) {
  throw new Error("Failed to create user message");
}
const history = await getRecentConversationHistory(
  userId,
  conversationId,
  userMessage.id,
  10
);
  // Generate title from the first user message
  if (
    !conversation.title ||
    conversation.title === "New Conversation"
  ) {
    const title = content.trim().slice(0, 60);

    await db
      .update(conversations)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId),
          eq(conversations.title, "New Conversation")
        )
      );
  } else {
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }

  const [assistantMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      role: "assistant",
      content: "Generating answer...",
      status: "pending",
    })
    .returning();

  if (!assistantMessage) {
    throw new Error("Failed to create assistant message");
  }

  try {
const result = await answerDocumentQuestion(
  conversation.documentId,
  content,
  userId,
  history
);

    const [updatedAssistantMessage] = await db
      .update(messages)
      .set({
        content: result.answer,
        status: "completed",
      })
      .where(eq(messages.id, assistantMessage.id))
      .returning();

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return {
      userMessage,
      assistantMessage: updatedAssistantMessage,
      citations: result.citations,
      sources: result.sources,
      grounded: result.grounded,
    };
  } catch (error) {
    await db
      .update(messages)
      .set({
        content: "Failed to generate answer.",
        status: "failed",
      })
      .where(eq(messages.id, assistantMessage.id));

    throw error;
  }
};