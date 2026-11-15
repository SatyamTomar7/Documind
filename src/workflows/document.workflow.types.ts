export type DocumentWorkflowInput = {
  userId: number;
};

export type DocumentWorkflowDocument = {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
  status: string;
  createdAt: Date;
};

export type DocumentWorkflowResult = {
  totalDocuments: number;
  failedDocuments: DocumentWorkflowDocument[];
  processingDocuments: DocumentWorkflowDocument[];
  completedDocuments: DocumentWorkflowDocument[];

  failedDocumentDetails: {
    id: number;
    originalName: string;
    mimeType: string;
    size: number;
    status: string;
    createdAt: Date;
    details: unknown;
    detailsError?: string | null;
  }[];

  summary: string;
};