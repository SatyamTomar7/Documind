import { searchDocument } from "./vectorsearch.services";
import { buildContext } from "./contextbuilder.services";
import {
  generateAnswer,
  generateAnswerStream,
  type ConversationHistory,
  rewriteQuestion,
} from "./llm.services";
import { rerankChunks } from "./reranker.services";
import { validateCitationGrounding } from "./citation.services";
import {
  executeTool,
  executeToolResult,
} from "../tools/tool.executor";
import {
  isDocumentCountQuestion,
  isDocumentListQuestion,
  isDocumentStatusQuestion,
  isDocumentDetailsQuestion,
  getDocumentIdFromQuestion,
} from "../tools/document.intent";
type RetrievedChunk = {
  chunkId: number;
  chunkIndex: number;
  content: string;
  distance: number;
};

type Citation = {
  source: number;
  chunkId: number;
  chunkIndex: number;
  content: string;
  distance: number;
};

const answerDocumentMetadataQuestion = async (
  toolName: "getDocumentStatus" | "getDocumentDetails",
  question: string,
  userId: number,
) => {
  const documentId = getDocumentIdFromQuestion(question);

  if (documentId === null) {
    return {
      answer:
        "Please include a valid document ID, for example: document ID 4.",
      citations: [],
      sources: [],
      candidateCount: 0,
      topDistance: null,
      rerankedCount: 0,
      grounded: true,
    };
  }

  const result = await executeToolResult(
    toolName,
    { documentId },
    { userId },
  );

  if (!result.ok) {
    return {
      answer:
        result.error.code === "DOCUMENT_NOT_FOUND"
          ? `I could not find document ${documentId}.`
          : `I could not retrieve document ${documentId}: ${result.error.message}`,
      citations: [],
      sources: [],
      candidateCount: 0,
      topDistance: null,
      rerankedCount: 0,
      grounded: true,
    };
  }

  if (
    typeof result.data !== "object" ||
    result.data === null ||
    !("originalName" in result.data) ||
    typeof result.data.originalName !== "string"
  ) {
    throw new Error(`Invalid ${toolName} result`);
  }

  const metadata = result.data as Record<string, unknown>;
  const originalName = metadata.originalName as string;
  const status =
    "status" in metadata && typeof metadata.status === "string"
      ? metadata.status
      : null;

  const answer =
    toolName === "getDocumentStatus"
      ? `Document ${documentId} (${originalName}) has processing status: ${
          status ?? "unknown"
        }.`
      : [
          `Document ${documentId}: ${originalName}`,
          status ? `Processing status: ${status}` : null,
          "mimeType" in metadata && typeof metadata.mimeType === "string"
            ? `Type: ${metadata.mimeType}`
            : null,
          "size" in metadata && typeof metadata.size === "number"
            ? `Size: ${metadata.size} bytes`
            : null,
        ]
          .filter((line): line is string => line !== null)
          .join("\n");

  return {
    answer,
    citations: [],
    sources: [],
    candidateCount: 0,
    topDistance: null,
    rerankedCount: 0,
    grounded: true,
  };
};

const validateAndMapCitations = (
  citations: unknown,
  chunks: RetrievedChunk[],
): Citation[] => {
  if (!Array.isArray(citations)) {
    return [];
  }

  return citations
    .filter(
      (citation): citation is number =>
        typeof citation === "number" &&
        Number.isInteger(citation) &&
        citation >= 1 &&
        citation <= chunks.length,
    )
    .filter((citation, index, array) => array.indexOf(citation) === index)
    .map((citation) => {
      const chunk = chunks[citation - 1];

      if (!chunk) {
        return null;
      }

      return {
        source: citation,
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        distance: chunk.distance,
      };
    })
    .filter((citation): citation is Citation => citation !== null);
};

export const answerDocumentQuestion = async (
  documentId: number,
  question: string,
  userId: number,
  history: ConversationHistory = [],
) => {
  if (isDocumentCountQuestion(question)) {
    console.info("[tool-call] getDocumentCount selected", {
      userId,
      source: "deterministic-document-count-route",
    });

    const result = await executeTool("getDocumentCount", {}, { userId });

    if (typeof result !== "number") {
      throw new Error("Invalid document count result");
    }

    console.info("[tool-call] getDocumentCount result used for final answer", {
      userId,
      count: result,
      passedBackToLlm: false,
      finalAnswerSource: "getDocumentCount-result",
    });

    return {
      answer: `You have uploaded ${result} document${result === 1 ? "" : "s"}.`,
      citations: [],
      sources: [],
      candidateCount: 0,
      topDistance: null,
      rerankedCount: 0,
      grounded: true,
    };
  }

  if (isDocumentListQuestion(question)) {
    const result = await executeTool("listDocuments", {}, { userId });

    if (!Array.isArray(result)) {
      throw new Error("Invalid document list result");
    }

    const answer =
      result.length === 0
        ? "You have not uploaded any documents."
        : [
            `You have uploaded ${result.length} document${
              result.length === 1 ? "" : "s"
            }:`,
            ...result.map((document) => {
              if (
                typeof document !== "object" ||
                document === null ||
                !("originalName" in document) ||
                typeof document.originalName !== "string"
              ) {
                throw new Error("Invalid document metadata result");
              }

              const status =
                "status" in document && typeof document.status === "string"
                  ? ` (${document.status})`
                  : "";

              return `- ${document.originalName}${status}`;
            }),
          ].join("\n");

    return {
      answer,
      citations: [],
      sources: [],
      candidateCount: 0,
      topDistance: null,
      rerankedCount: 0,
      grounded: true,
    };
  }

  if (isDocumentStatusQuestion(question)) {
    return answerDocumentMetadataQuestion(
      "getDocumentStatus",
      question,
      userId,
    );
  }

  if (isDocumentDetailsQuestion(question)) {
    return answerDocumentMetadataQuestion(
      "getDocumentDetails",
      question,
      userId,
    );
  }

  console.log("Current question:", question);
  console.log("Conversation history:", history);
  const retrievalQuery = await rewriteQuestion(question, history);

  console.log("Original question:", question);
  console.log("Retrieval query:", retrievalQuery);

  const candidateChunks = await searchDocument(
    userId,
    documentId,
    retrievalQuery,
  );
  console.dir(candidateChunks, { depth: null });

  const candidateCount = candidateChunks.length;
  const topDistance = candidateChunks[0]?.distance ?? null;

  const chunks = await rerankChunks(question, candidateChunks, 5);

  console.dir(chunks, { depth: null });

  const rerankedCount = chunks.length;
  if (chunks.length === 0) {
    return {
      answer: "I don't have enough information in the provided document.",
      citations: [],
      sources: [],
      candidateCount,
      topDistance,
      rerankedCount,
      grounded: false,
    };
  }

  const context = buildContext(chunks);

const answer = await generateAnswer(question, context, userId, history);

  const citations = validateAndMapCitations(answer.citations, chunks);

  const grounding = validateCitationGrounding(citations, answer.answer);

  return {
    answer: grounding.grounded
      ? answer.answer
      : "I don't have enough information in the provided document.",
    citations: grounding.grounded ? grounding.citations : [],
    sources: chunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      chunkIndex: chunk.chunkIndex,
      distance: chunk.distance,
    })),
    candidateCount,
    topDistance,
    rerankedCount,
    grounded: grounding.grounded,
  };
};

export const streamDocumentQuestion = async (
  userId: number,
  documentId: number,
  question: string,
  onChunk: (chunk: string) => void,
) => {
  const candidateChunks = await searchDocument(userId, documentId, question);

  const candidateCount = candidateChunks.length;
  const topDistance = candidateChunks[0]?.distance ?? null;

  const chunks = await rerankChunks(question, candidateChunks, 5);

  const rerankedCount = chunks.length;

  if (chunks.length === 0) {
    return {
      answer: "I don't have enough information in the provided document.",
      citations: [],
      sources: [],
      candidateCount,
      topDistance,
      rerankedCount,
      grounded: false,
    };
  }

  const context = buildContext(chunks);

  await generateAnswerStream(question, context, onChunk);

  return {
    sources: chunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      chunkIndex: chunk.chunkIndex,
      distance: chunk.distance,
    })),
    candidateCount,
    topDistance,
    rerankedCount,
  };
};
