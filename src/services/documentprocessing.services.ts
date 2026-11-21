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
import env from "../config/env";

const uploadDir = path.join(process.cwd(), "uploads");
const DOCUMENT_PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ApiError(504, "Document processing timed out"));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

export const extractPdfText = async (storageKey: string) => {
  const filePath = path.join(uploadDir, storageKey);

  const fileBuffer = await fs.readFile(filePath);

  const parser = new PDFParse({
    data: fileBuffer,
  });

  try {
    const pdfData = await parser.getText();

    return pdfData.text;
  } catch (error) {
    console.error("PDF text extraction failed:", error);
    throw new ApiError(422, "Unable to extract text from PDF");
  } finally {
    await parser.destroy();
  }
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
    return await withTimeout(
      (async () => {
        // 1. Extract text from document
        const rawText = await extractAndProcessDocument(
          document.storageKey,
          document.mimeType,
        );

        // 2. Normalize extracted text
        const text = normalizeText(rawText);

        if (!text) {
          throw new ApiError(
            422,
            "Document does not contain extractable text",
          );
        }

        // 3. Create chunks and generate embeddings before replacing stored data
        const chunks = chunkText(
          text,
          env.documentChunkSize,
          env.documentChunkOverlap,
        );
        const chunksWithEmbeddings: (typeof documentChunks.$inferInsert)[] =
          [];

        for (const [index, content] of chunks.entries()) {
          const embedding = await generateEmbedding(content);

          chunksWithEmbeddings.push({
            documentId: document.id,
            content,
            chunkIndex: index,
            embedding,
          });
        }

        await db.transaction(async (tx) => {
          // 4. Replace content and chunks atomically
          await tx
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

          await tx
            .delete(documentChunks)
            .where(eq(documentChunks.documentId, document.id));

          if (chunksWithEmbeddings.length > 0) {
            await tx
              .insert(documentChunks)
              .values(chunksWithEmbeddings);
          }

          await tx
            .update(documents)
            .set({
              status: DOCUMENT_STATUS.COMPLETED,
              updatedAt: new Date(),
            })
            .where(eq(documents.id, documentId));
        });

        return text;
      })(),
      DOCUMENT_PROCESSING_TIMEOUT_MS,
    );
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