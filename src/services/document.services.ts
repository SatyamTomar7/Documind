import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { documents, documentContents } from "../db/schema";
import { deleteUploadedFile } from "../utils/file.utils";
import { DOCUMENT_STATUS } from "../constants/document.constants";
export const createDocument = async (
  userId: number,
  file: Express.Multer.File
) => {
  try {
    const [document] = await db
      .insert(documents)
      .values({
        userId,
        originalName: file.originalname,
        storageKey: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        status: DOCUMENT_STATUS.PENDING,
      })
      .returning();

    return document;
  } catch (error) {
    try {
      await deleteUploadedFile(file.filename);
    } catch (cleanupError) {
      console.error("Failed to clean up uploaded file:", cleanupError);
    }

    throw error;
  }
};
export const getUserDocuments = async (userId: number) => {
  const userDocuments = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId));

  return userDocuments;
};
export const getDocumentById = async (
  userId: number,
  documentId: number
) => {
  const [document] = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.userId, userId)
      )
    );

  return document;
};
export const deleteDocument = async (
  userId: number,
  documentId: number
) => {
  const [document] = await db
    .delete(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.userId, userId)
      )
    )
    .returning();

  if (!document) {
    return null;
  }

  await deleteUploadedFile(document.storageKey);

  return document;
};
export const getDocumentStatus = async (
  userId: number,
  documentId: number,
) => {
  const [document] = await db
    .select({
      id: documents.id,
      originalName: documents.originalName,
      status: documents.status,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.userId, userId),
      ),
    )
    .limit(1);

  if (!document) {
    throw new Error("Document not found");
  }

  return document;
};
export const getDocumentCount = async (userId: number) => {
  const userDocuments = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId));

  const count = userDocuments.length;

  console.info("[tool-call] getDocumentCount PostgreSQL result", {
    userId,
    count,
  });

  return count;
};
export const listDocuments = async (userId: number) => {
  return db
    .select({
      id: documents.id,
      originalName: documents.originalName,
      mimeType: documents.mimeType,
      size: documents.size,
      status: documents.status,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));
};
export const getDocumentDetails = async (
  documentId: number,
  userId: number,
) => {
  const [document] = await db
    .select({
      id: documents.id,
      originalName: documents.originalName,
      mimeType: documents.mimeType,
      size: documents.size,
      status: documents.status,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.userId, userId),
      ),
    )
    .limit(1);

  if (!document) {
    throw new Error("Document not found");
  }

  return document;
};