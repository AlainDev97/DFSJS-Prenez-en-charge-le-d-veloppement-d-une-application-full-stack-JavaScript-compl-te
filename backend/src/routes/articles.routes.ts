import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import { articlesController } from "../controllers/articles.controller.js";

export const articlesRouter = Router();

articlesRouter.get("/", requireAuth, articlesController.getAll);
articlesRouter.get("/:id", requireAuth, articlesController.getById);

articlesRouter.post("/", requireAuth, articlesController.create);
