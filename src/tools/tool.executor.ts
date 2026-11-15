import {
  getDocumentCount,
  listDocuments,
  getDocumentStatus,
  getDocumentDetails,
} from "../services/document.services";

type ToolContext = {
  userId: number;
};

type ToolHandler = (
  args: unknown,
  context: ToolContext,
) => Promise<unknown>;

type ToolErrorCode =
  | "INVALID_TOOL_ARGUMENTS"
  | "INVALID_DOCUMENT_ID"
  | "DOCUMENT_NOT_FOUND"
  | "UNSUPPORTED_TOOL"
  | "TOOL_EXECUTION_FAILED";

export type ToolExecutionResult =
  | { ok: true; data: unknown }
  | {
      ok: false;
      error: {
        code: ToolErrorCode;
        message: string;
      };
    };

const validateEmptyArgs = (args: unknown): void => {
  if (
    typeof args !== "object" ||
    args === null ||
    Array.isArray(args) ||
    Object.keys(args).length !== 0
  ) {
    throw new Error("Invalid tool arguments");
  }
};

const validateDocumentIdArgs = (
  args: unknown,
): { documentId: number } => {
  if (
    typeof args !== "object" ||
    args === null ||
    Array.isArray(args)
  ) {
    throw new Error("Invalid tool arguments");
  }

  const value = args as Record<string, unknown>;

  if (
    Object.keys(value).length !== 1 ||
    !Number.isSafeInteger(value.documentId) ||
    (value.documentId as number) <= 0
  ) {
    throw new Error("Invalid documentId");
  }

  return {
    documentId: value.documentId as number,
  };
};

const getDocumentCountHandler: ToolHandler = async (
  args,
  context,
) => {
  validateEmptyArgs(args);
  return getDocumentCount(context.userId);
};

const listDocumentsHandler: ToolHandler = async (
  args,
  context,
) => {
  validateEmptyArgs(args);
  return listDocuments(context.userId);
};

const getDocumentStatusHandler: ToolHandler = async (args, context) => {
  const { documentId } = validateDocumentIdArgs(args);
  return getDocumentStatus(context.userId, documentId);
};

const getDocumentDetailsHandler: ToolHandler = async (
  args,
  context,
) => {
  const { documentId } = validateDocumentIdArgs(args);

  return getDocumentDetails(documentId, context.userId);
};

const toolRegistry: Record<string, ToolHandler> = {
  getDocumentCount: getDocumentCountHandler,
  listDocuments: listDocumentsHandler,
  getDocumentStatus: getDocumentStatusHandler,
  getDocumentDetails: getDocumentDetailsHandler,
};

export const executeTool = async (
  name: string,
  args: unknown,
  context: ToolContext,
): Promise<unknown> => {
  console.info("[tool-call] executor invoked", {
    toolName: name,
    userId: context.userId,
  });

  const handler = toolRegistry[name];

  if (!handler) {
    throw new Error(`Unsupported tool: ${name}`);
  }

  const result = await handler(args, context);

  console.info("[tool-call] executor completed", {
    toolName: name,
    userId: context.userId,
    resultType: Array.isArray(result) ? "array" : typeof result,
  });

  return result;
};

export const executeToolResult = async (
  name: string,
  args: unknown,
  context: ToolContext,
): Promise<ToolExecutionResult> => {
  try {
    return {
      ok: true,
      data: await executeTool(name, args, context),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tool execution failed";

    const code: ToolErrorCode =
      message === "Document not found"
        ? "DOCUMENT_NOT_FOUND"
        : message === "Invalid documentId"
          ? "INVALID_DOCUMENT_ID"
          : message === "Invalid tool arguments"
            ? "INVALID_TOOL_ARGUMENTS"
            : message.startsWith("Unsupported tool:")
              ? "UNSUPPORTED_TOOL"
              : "TOOL_EXECUTION_FAILED";

    return {
      ok: false,
      error: {
        code,
        message,
      },
    };
  }
};