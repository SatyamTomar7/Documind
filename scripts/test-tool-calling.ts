import assert from "node:assert/strict";
import {
  isDocumentCountQuestion,
  isDocumentDetailsQuestion,
  isDocumentListQuestion,
  isDocumentStatusQuestion,
} from "../src/tools/document.intent";
import { documentTools } from "../src/tools/document.tools";
import { executeToolResult } from "../src/tools/tool.executor";
import { answerDocumentQuestion } from "../src/services/rag.services";

const testToolDefinitions = () => {
  assert.deepEqual(
    documentTools.map((tool) => tool.name),
    [
      "getDocumentCount",
      "listDocuments",
      "getDocumentStatus",
      "getDocumentDetails",
    ],
  );
};

const testIntentSelection = () => {
  assert.equal(isDocumentCountQuestion("How many documents do I have?"), true);
  assert.equal(
    isDocumentCountQuestion("How many documents have I uploaded?"),
    true,
  );
  assert.equal(isDocumentListQuestion("List my uploaded documents"), true);
  assert.equal(isDocumentStatusQuestion("What is the status of document 4?"), true);
  assert.equal(isDocumentDetailsQuestion("Show details for document 4"), true);
};

const testInvalidToolArguments = async () => {
  const invalidId = await executeToolResult(
    "getDocumentStatus",
    { documentId: 0 },
    { userId: 1 },
  );
  assert.deepEqual(invalidId, {
    ok: false,
    error: {
      code: "INVALID_DOCUMENT_ID",
      message: "Invalid documentId",
    },
  });

  const invalidShape = await executeToolResult(
    "getDocumentStatus",
    { documentId: "4" },
    { userId: 1 },
  );
  assert.deepEqual(invalidShape, {
    ok: false,
    error: {
      code: "INVALID_DOCUMENT_ID",
      message: "Invalid documentId",
    },
  });
};

const testUnsupportedTool = async () => {
  const result = await executeToolResult(
    "doesNotExist",
    {},
    { userId: 1 },
  );

  assert.deepEqual(result, {
    ok: false,
    error: {
      code: "UNSUPPORTED_TOOL",
      message: "Unsupported tool: doesNotExist",
    },
  });
};

const testMissingDocumentIdResponse = async () => {
  const result = await answerDocumentQuestion(
    1,
    "What is the status of this document?",
    1,
  );

  assert.equal(result.answer.includes("valid document ID"), true);
  assert.equal(result.grounded, true);
};

const main = async () => {
  testToolDefinitions();
  testIntentSelection();
  await testInvalidToolArguments();
  await testUnsupportedTool();
  await testMissingDocumentIdResponse();
  console.log("Tool-calling tests passed");
};

main().catch((error) => {
  console.error("Tool-calling tests failed:", error);
  process.exitCode = 1;
});
