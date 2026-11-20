import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import {
  documents,
  documentContents,
  documentChunks,
} from "../db/schema";
import { generateEmbedding } from "./embedding.services";
import { normalizeText } from "../utils/text.utils";
import { chunkText } from "../utils/chunk.utils";
import { DOCUMENT_STATUS } from "../constants/document.constants";
import { ApiError } from "../utils/Apierror";

const uploadDir = path.join(process.cwd(), "uploads");

export const extractPdfText = async (storageKey: string) => {
  const filePath = path.join(uploadDir, storageKey);

  const fileBuffer = await fs.readFile(filePath);

  const parser = new PDFParse({
    data: fileBuffer,
  });

  const pdfData = await parser.getText();

  await parser.destroy();

  return pdfData.text;
};

export const extractTxtText = async (storageKey: string) => {
  const filePath = path.join(uploadDir, storageKey);

  return fs.readFile(filePath, "utf8");
};

export const extractDocxText = async (storageKey: string) => {
  const filePath = path.join(uploadDir, storageKey);
  const result = await mammoth.extractRawText({ path: filePath });

  return result.value;
};

export const processDocument = async (
  userId: number,
  documentId: number
) => {
  console.log(documentChunks.embedding.columnType);
console.log(documentChunks.embedding.mapToDriverValue([1, 2, 3]));
  const [document] = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.userId, userId)
      )
    );

  if (!document) {
    throw new Error("Document not found");
  }

  await db
    .update(documents)
    .set({
      status: DOCUMENT_STATUS.PROCESSING,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId));

  try {
    // 1. Extract text from document
    const rawText = await extractAndProcessDocument(
      document.storageKey,
      document.mimeType,
    );

    // 2. Normalize extracted text
    const text = normalizeText(rawText);

    // 3. Save extracted text
    await db
      .insert(documentContents)
      .values({
        documentId: document.id,
        content: text,
      })
      .onConflictDoUpdate({
        target: documentContents.documentId,
        set: {
          content: text,
          updatedAt: new Date(),
        },
      });

    // 4. Create chunks
    const chunks = chunkText(text);

    // 5. Remove old chunks
    await db
      .delete(documentChunks)
      .where(
        eq(documentChunks.documentId, document.id)
      );

    // 6. Generate embeddings and save chunks
    if (chunks.length > 0) {
      const chunksWithEmbeddings = [];

      for (const [index, content] of chunks.entries()) {
        const embedding = await generateEmbedding(content);

        chunksWithEmbeddings.push({
          documentId: document.id,
          content,
          chunkIndex: index,
          embedding,
        });
      }

      await db
        .insert(documentChunks)
        .values(chunksWithEmbeddings);
    }

    // 7. Mark processing complete
    await db
      .update(documents)
      .set({
        status: DOCUMENT_STATUS.COMPLETED,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    return text;
  } catch (error) {
    // 8. Mark processing failed
    await db
      .update(documents)
      .set({
        status: DOCUMENT_STATUS.FAILED,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    throw error;
  }
};

export const retryDocument = async (
  userId: number,
  documentId: number,
) => {
  const [document] = await db
    .select({
      id: documents.id,
      status: documents.status,
    })
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.userId, userId),
      ),
    );

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  if (document.status !== DOCUMENT_STATUS.FAILED) {
    throw new ApiError(
      409,
      "Only failed documents can be retried",
    );
  }

  return processDocument(userId, documentId);
};

const extractAndProcessDocument = async (
  storageKey: string,
  mimeType: string,
) => {
  if (mimeType === "text/plain") {
    return extractTxtText(storageKey);
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocxText(storageKey);
  }

  return await extractPdfText(storageKey);
};