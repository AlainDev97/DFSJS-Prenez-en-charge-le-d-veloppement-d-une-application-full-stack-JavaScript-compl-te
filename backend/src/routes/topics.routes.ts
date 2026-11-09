import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { topicsController } from "../controllers/topics.controller.js";

export const topicsRouter = Router();

topicsRouter.get("/", requireAuth, topicsController.getAll);
