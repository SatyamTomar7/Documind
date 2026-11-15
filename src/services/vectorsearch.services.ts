import { sql } from "drizzle-orm";
import { db } from "../db";
import { generateEmbedding } from "./embedding.services";

export const searchDocument = async (
  userId: number,
  documentId: number,
  query: string,
  candidateLimit: number = 10,
  maxDistance: number = 0.3999
)=> {
  const queryEmbedding = await generateEmbedding(query);

  const vector = `[${queryEmbedding.join(",")}]`;

  const results = await db.execute(sql`
    SELECT
      id,
      document_id,
      chunk_index,
      content,
      document_chunks.embedding <=> ${vector}::vector AS distance
    FROM document_chunks
    INNER JOIN documents
      ON documents.id = document_chunks.document_id
    WHERE document_chunks.document_id = ${documentId}
      AND documents.user_id = ${userId}
      AND document_chunks.embedding <=> ${vector}::vector <= ${maxDistance}
    ORDER BY document_chunks.embedding <=> ${vector}::vector
    LIMIT ${candidateLimit}
  `);

  return results.rows.map((row) => ({
    chunkId: Number(row.id),
    chunkIndex: Number(row.chunk_index),
    content: String(row.content),
    distance: Number(row.distance),
  }));
};