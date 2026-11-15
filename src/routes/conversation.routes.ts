import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createConversationController,
  getUserConversationsController,
  getConversationController,
  deleteConversationController,
  createMessageController,
  sendMessageController
} from "../controllers/conversation.controller";
const router = Router();

router.post(
  "/conversations",
  authenticate,
  createConversationController
);
router.get(
  "/conversations",
  authenticate,
  getUserConversationsController
);
router.get(
  "/conversations/:id",
  authenticate,
  getConversationController
);
router.delete(
  "/conversations/:id",
  authenticate,
  deleteConversationController
);
router.post(
  "/conversations/:id/messages",
  authenticate,
  createMessageController
);
router.post(
  "/conversations/:id/messages/ask",
  authenticate,
  sendMessageController
);
export default router;