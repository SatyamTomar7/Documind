import { Router } from "express";
import { loginController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { loginSchema } from "../validator/auth.validator";
import { refreshTokenSchema } from "../validator/auth.validator";
import { refreshTokenController } from "../controllers/auth.controller";
import { loginRateLimit } from "../middleware/login-rate-limit.middleware";
const router = Router();

router.post(
  "/auth/login",
  loginRateLimit,
  validate(loginSchema),
  loginController
);
router.post(
  "/auth/refresh",
  validate(refreshTokenSchema),
  refreshTokenController
);
export default router;