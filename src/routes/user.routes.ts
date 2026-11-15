import { Router } from "express";
import {validate} from "../middleware/validate.middleware"
import { createUserSchema } from "../validator/user.validator";
import { authenticate } from "../middleware/auth.middleware";
import {
  createUserController,
  getCurrentUserController,
} from "../controllers/user.controller";
const router = Router();

router.post(
  "/users",
  validate(createUserSchema),
  createUserController
);
router.get(
  "/users/me",
  authenticate,
  getCurrentUserController
);

export default router;