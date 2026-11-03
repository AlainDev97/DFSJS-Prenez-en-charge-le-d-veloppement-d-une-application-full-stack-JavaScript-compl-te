import type { Request, Response } from "express";
import { z } from "zod";
import { topicsService } from "../services/topics.service.js";

const topicsQuerySchema = z.strictObject({
  search: z.string().trim().max(100).optional(),
});

export const topicsController = {
  async getAll(req: Request, res: Response) {
    const parsed = topicsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        error: "Paramètres de recherche invalides",
      });
      return;
    }

    const topics = await topicsService.getAll(parsed.data.search);

    res.status(200).json({
      data: topics,
    });
  },
};
