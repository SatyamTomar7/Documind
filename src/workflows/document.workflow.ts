import { executeTool } from "../tools/tool.executor";
import type {
  DocumentWorkflowInput,
  DocumentWorkflowDocument,
  DocumentWorkflowResult,
} from "./document.workflow.types";
import { generateWorkflowSummary } from "../services/workflow.summary.services";
export const runDocumentIntelligenceWorkflow = async (
  input: DocumentWorkflowInput,
): Promise<DocumentWorkflowResult> => {
  const { userId } = input;

  // Step 1: Retrieve the authenticated user's documents.
  const documentsResult = await executeTool(
    "listDocuments",
    {},
    { userId },
  );

  if (!Array.isArray(documentsResult)) {
    throw new Error("Invalid response from listDocuments tool");
  }

  // Step 2: Categorize documents by processing status.
  const documents = documentsResult as DocumentWorkflowDocument[];

  const failedDocuments = documents.filter(
    (document) => document.status === "failed",
  );

const failedDocumentDetails = await Promise.all(
  failedDocuments.map(async (document) => {
    try {
      const result = await executeTool(
        "getDocumentDetails",
        { documentId: document.id },
        { userId },
      );

      return {
        ...document,
        details: result,
        detailsError: null,
      };
    } catch (error) {
      return {
        ...document,
        details: null,
        detailsError:
          error instanceof Error
            ? error.message
            : "Failed to fetch document details",
      };
    }
  }),
);
  const processingDocuments = documents.filter(
    (document) =>
      document.status === "pending" ||
      document.status === "processing",
  );

  const completedDocuments = documents.filter(
    (document) => document.status === "completed",
  );

console.log("[workflow] Document Intelligence Summary", {
  userId,
  totalDocuments: documents.length,
  failedCount: failedDocuments.length,
  processingCount: processingDocuments.length,
  completedCount: completedDocuments.length,
  failedDetailsCount: failedDocumentDetails.length,
});

let summary: string;

try {
  summary = await generateWorkflowSummary({
    totalDocuments: documents.length,
    failedCount: failedDocuments.length,
    processingCount: processingDocuments.length,
    completedCount: completedDocuments.length,
  });
} catch (error) {
  console.error("[workflow] Summary generation failed:", error);

  summary =
    `You have ${documents.length} document(s): ` +
    `${completedDocuments.length} completed, ` +
    `${processingDocuments.length} processing, and ` +
    `${failedDocuments.length} failed.`;
}

  // Step 3: Return the structured workflow result.
  return {
    totalDocuments: documents.length,
    failedDocuments,
    processingDocuments,
    completedDocuments,
    failedDocumentDetails,
    summary
  };
};