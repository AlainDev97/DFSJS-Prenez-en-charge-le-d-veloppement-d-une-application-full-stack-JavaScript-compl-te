import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import { subscriptionsController } from "../controllers/subscriptions.controller.js";

export const subscriptionsRouter = Router();

// Toutes ces routes nécessitent une session authentifiée.
subscriptionsRouter.use(requireAuth);

subscriptionsRouter.get("/", subscriptionsController.getAll);

subscriptionsRouter.post("/", subscriptionsController.subscribe);

subscriptionsRouter.delete("/:topicId", subscriptionsController.unsubscribe);
