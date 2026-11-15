import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { uploadDocument } from "../middleware/upload.middleware";
import {
  createDocumentController,
  getUserDocumentsController,
  getDocumentByIdController,
  deleteDocumentController,
  processDocumentController,
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
  getUserDocumentsController
);
router.get(
  "/documents/:id",
  authenticate,
  getDocumentByIdController
);
router.delete(
  "/documents/:id",
  authenticate,
  deleteDocumentController
);
router.post(
  "/documents/:id/process",
  authenticate,
  processDocumentController
);
router.get(
  "/documents/:id/status",
  authenticate,
  getDocumentStatusController
);
router.post(
  "/documents/:id/stream",
  authenticate,
  streamDocumentQuestionController
);
export default router;