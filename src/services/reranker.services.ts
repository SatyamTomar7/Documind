import { CohereClientV2 } from "cohere-ai";
import env from "../config/env";

type RerankChunk = {
  chunkId: number;
  chunkIndex: number;
  content: string;
  distance: number;
};

const cohere = env.cohere_api_key
  ? new CohereClientV2({
      token: env.cohere_api_key,
    })
  : null;

export const rerankChunks = async (
  question: string,
  chunks: RerankChunk[],
  topK: number = 5
) => {
  if (!cohere) {
    throw new Error("Cohere API key is not configured");
  }

  if (chunks.length === 0) {
    return [];
  }

  const response = await cohere.rerank({
    model: "rerank-v4.0-pro",
    query: question,
    documents: chunks.map((chunk) => chunk.content),
    topN: Math.min(topK, chunks.length),
  });

  return response.results
    .map((result) => {
      const chunk = chunks[result.index];

      if (!chunk) {
        return null;
      }

      return {
        ...chunk,
        rerankScore: result.relevanceScore,
      };
    })
    .filter((chunk) => chunk !== null);
};