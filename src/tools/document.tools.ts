import { Type } from "@google/genai";

export const documentTools = [
  {
    name: "getDocumentCount",
    description:
      "Get the total number of documents uploaded by the authenticated user.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "listDocuments",
    description:
      "List documents uploaded by the authenticated user, including their names, types, sizes, statuses, and upload dates.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "getDocumentStatus",
    description:
      "Get the processing status of a document owned by the authenticated user.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        documentId: {
          type: Type.INTEGER,
          description: "The ID of the document.",
        },
      },
      required: ["documentId"],
    },
  },
  {
    name: "getDocumentDetails",
    description:
      "Get metadata for a document owned by the authenticated user.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        documentId: {
          type: Type.INTEGER,
          description: "The ID of the document.",
        },
      },
      required: ["documentId"],
    },
  },
];