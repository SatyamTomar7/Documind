import { GoogleGenAI } from "@google/genai";
import env from "../config/env";
const ai = new GoogleGenAI({
  apiKey: env.gemini_api_key,
});

export const generateEmbedding = async (text: string) => {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: text,
    config: {
      outputDimensionality: 1536,
    },
  });

  return response.embeddings?.[0]?.values ?? [];
};