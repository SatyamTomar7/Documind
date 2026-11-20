import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  conversationIdSchema,
  createConversationSchema,
  getConversationSchema,
  messageSchema,
} from "../validator/conversation.validator";
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
  validate(createConversationSchema),
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
  validate(getConversationSchema),
  getConversationController
);
router.delete(
  "/conversations/:id",
  authenticate,
  validate(conversationIdSchema),
  deleteConversationController
);
router.post(
  "/conversations/:id/messages",
  authenticate,
  validate(messageSchema),
  createMessageController
);
router.post(
  "/conversations/:id/messages/ask",
  authenticate,
  validate(messageSchema),
  sendMessageController
);
export default router;