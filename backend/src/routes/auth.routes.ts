import { Router } from "express";

import { authController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getCsrfToken } from "../middleware/csrf.middleware.js";
import {
  loginLimiter,
  registerLimiter,
} from "../middleware/rate-limit.middleware.js";

export const authRouter = Router();

authRouter.get("/csrf", getCsrfToken);

authRouter.post("/register", registerLimiter, authController.register);

authRouter.post("/login", loginLimiter, authController.login);

authRouter.get("/me", requireAuth, authController.me);

authRouter.post("/logout", requireAuth, authController.logout);
