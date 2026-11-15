import { gemini, GEMINI_MODEL } from "../services/llm.services";
import { documentTools } from "../tools/document.tools";
import {
  executeToolResult,
  type ToolExecutionResult,
} from "../tools/tool.executor";
import type { Content, Part, FunctionCallingConfigMode } from "@google/genai";
export type DocumentInvestigationInput = {
  userId: number;
  goal: string;
};

export type DocumentInvestigationResult = {
  summary: string;
  findings: string[];
  recommendations: string[];
  documentsInvestigated: number;
  toolsUsed: string[];
};

const DOCUMENT_INVESTIGATION_PROMPT = `
You are DocuMind's Document Investigation Agent.

Your goal is to investigate the authenticated user's documents
and identify documents that may require attention.

Rules:
- Use only the provided document tools.
- Investigate based on actual tool results.
- Inspect failed documents using getDocumentDetails when useful.
- Use getDocumentStatus when additional status verification is needed.
- Do not invent document information or failure reasons.
- Do not assume that processing documents are stuck.
- If information is unavailable, clearly state that.
- Never modify or delete documents.
- Finish when sufficient evidence has been collected.
- Return a concise investigation report.
- The final response must be valid JSON with exactly these fields:
  summary, findings, recommendations, documentsInvestigated.
- summary must be a string.
- findings and recommendations must be arrays of strings.
- documentsInvestigated must be a non-negative integer.
- documentsInvestigated counts unique documents inspected, not tool calls.
- Do not include markdown code fences around the JSON.
`.trim();

const MAX_TOOL_ROUNDS = 5;

export const runDocumentInvestigation = async (
  input: DocumentInvestigationInput,
): Promise<DocumentInvestigationResult> => {
  const { userId, goal } = input;

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error("Invalid authenticated user ID");
  }

  if (!goal.trim()) {
    throw new Error("Investigation goal cannot be empty");
  }

  let contents: Content[] = [
    {
      role: "user",
      parts: [{ text: goal.trim() }],
    },
  ];

  const toolsUsed = new Set<string>();
  const investigatedDocumentIds = new Set<number>();
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: DOCUMENT_INVESTIGATION_PROMPT,
        temperature: 0,
        tools: [
          {
            functionDeclarations: [...documentTools],
          },
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: "AUTO" as FunctionCallingConfigMode,
          },
        },
      },
    });

    const functionCalls = response.functionCalls ?? [];

    // No tool calls means Gemini has produced its final response.
    if (functionCalls.length === 0) {
      const rawResponse = response.text?.trim();

      if (!rawResponse) {
        throw new Error("Agent returned an empty final response");
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(
          rawResponse
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/, "")
            .trim(),
        );
      } catch {
        throw new Error("Agent returned invalid JSON");
      }

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("summary" in parsed) ||
        !("findings" in parsed) ||
        !("recommendations" in parsed) ||
        !("documentsInvestigated" in parsed)
      ) {
        throw new Error("Agent returned an invalid report structure");
      }

      const report = parsed as Record<string, unknown>;

      if (
        typeof report.summary !== "string" ||
        !Array.isArray(report.findings) ||
        !report.findings.every((item) => typeof item === "string") ||
        !Array.isArray(report.recommendations) ||
        !report.recommendations.every((item) => typeof item === "string") ||
        typeof report.documentsInvestigated !== "number" ||
        !Number.isSafeInteger(report.documentsInvestigated) ||
        report.documentsInvestigated < 0
      ) {
        throw new Error("Agent returned invalid report fields");
      }

      return {
        summary: report.summary,
        findings: report.findings,
        recommendations: report.recommendations,
       documentsInvestigated: investigatedDocumentIds.size,
        toolsUsed: [...toolsUsed],
      };
    }

    const modelContent = response.candidates?.[0]?.content;

    if (!modelContent) {
      throw new Error("Gemini returned no content for its function calls");
    }

    // Preserve Gemini's tool-call message in the conversation.
    contents.push(modelContent);

    const functionResponses: Part[] = await Promise.all(
      functionCalls.map(async (functionCall): Promise<Part> => {
        if (!functionCall.name) {
          throw new Error("Gemini returned a function call without a name");
        }

        toolsUsed.add(functionCall.name);

        const toolResult: ToolExecutionResult = await executeToolResult(
          functionCall.name,
          functionCall.args ?? {},
          { userId },
        );
        if (toolResult.ok) {
          const data = toolResult.data;

          if (functionCall.name === "listDocuments" && Array.isArray(data)) {
            for (const document of data) {
              if (
                typeof document === "object" &&
                document !== null &&
                "id" in document &&
                typeof document.id === "number" &&
                Number.isSafeInteger(document.id) &&
                document.id > 0
              ) {
                investigatedDocumentIds.add(document.id);
              }
            }
          }

          if (
            (functionCall.name === "getDocumentDetails" ||
              functionCall.name === "getDocumentStatus") &&
            typeof data === "object" &&
            data !== null &&
            "id" in data &&
            typeof data.id === "number" &&
            Number.isSafeInteger(data.id) &&
            data.id > 0
          ) {
            investigatedDocumentIds.add(data.id);
          }
        }

        return {
          functionResponse: {
            name: functionCall.name,
            response: {
              result: toolResult,
            },
          },
        };
      }),
    );

    // Return tool results to Gemini for its next decision.
    contents.push({
      role: "user",
      parts: functionResponses,
    });
  }

  throw new Error(
    `Agent exceeded the maximum of ${MAX_TOOL_ROUNDS} tool-calling rounds`,
  );
};
