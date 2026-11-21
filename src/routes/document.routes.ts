import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { uploadDocument } from "../middleware/upload.middleware";
import {
  documentIdSchema,
  documentListSchema,
  streamQuestionSchema,
} from "../validator/document.validator";
import {
  createDocumentController,
  getUserDocumentsController,
  getDocumentByIdController,
  deleteDocumentController,
  processDocumentController,
  retryDocumentController,
  getDocumentStatusController,
  streamDocumentQuestionController
} from "../controllers/document.controller";
import { documentWorkflowController} from "../controllers/document.workflow.controller";
import { documentInvestigationController } from "../controllers/document.investigation.controller";
const router = Router();

router.post(
  "/documents",
  authenticate,
  uploadDocument.single("file"),
  createDocumentController
);

router.get(
  "/documents/workflow",
  authenticate,
  documentWorkflowController,
);
router.post(
  "/documents/investigate",
  authenticate,
  documentInvestigationController,
);
router.get(
  "/fetchdoc",
  authenticate,
  validate(documentListSchema),
  getUserDocumentsController
);
router.get(
  "/documents/:id",
  authenticate,
  validate(documentIdSchema),
  getDocumentByIdController
);
router.delete(
  "/documents/:id",
  authenticate,
  validate(documentIdSchema),
  deleteDocumentController
);
router.post(
  "/documents/:id/process",
  authenticate,
  validate(documentIdSchema),
  processDocumentController
);
router.post(
  "/documents/:id/retry",
  authenticate,
  validate(documentIdSchema),
  retryDocumentController,
);
router.get(
  "/documents/:id/status",
  authenticate,
  validate(documentIdSchema),
  getDocumentStatusController
);
router.post(
  "/documents/:id/stream",
  authenticate,
  validate(streamQuestionSchema),
  streamDocumentQuestionController
);
export default router;