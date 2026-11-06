import { Router } from "express";
import { topicsController } from "../controllers/topics.controller.js";

export const topicsRouter = Router();

topicsRouter.get("/", topicsController.getAll);
