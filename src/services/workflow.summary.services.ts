import { GoogleGenAI } from "@google/genai";
import { gemini, GEMINI_MODEL } from "./llm.services";
export type WorkflowSummaryInput = {
  totalDocuments: number;
  failedCount: number;
  processingCount: number;
  completedCount: number;
};

export const buildWorkflowSummaryPrompt = (
  input: WorkflowSummaryInput,
): string => {
  return `
You are summarizing a document management workflow.

Use only the following verified statistics:
- Total documents: ${input.totalDocuments}
- Failed documents: ${input.failedCount}
- Processing documents: ${input.processingCount}
- Completed documents: ${input.completedCount}

Write a concise summary in 2-3 sentences.
Do not invent document names, causes of failure, or other facts.
Mention any documents that may need attention.
`;
};
export const generateWorkflowSummary = async (
  input: WorkflowSummaryInput,
): Promise<string> => {

  const prompt = buildWorkflowSummaryPrompt(input);

  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: 0,
    },
  });
  

  const summary = response.text?.trim();

  if (!summary) {
    throw new Error("LLM returned an empty workflow summary");
  }

  return summary;
};