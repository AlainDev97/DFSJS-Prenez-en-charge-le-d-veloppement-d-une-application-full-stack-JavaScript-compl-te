import type { Request, Response } from "express";
import { z } from "zod";

import {
  ArticleNotFoundError,
  articlesService,
} from "../services/articles.service.js";
import { ArticleTopicNotFoundError } from "../services/articles.service.js";

const articlesQuerySchema = z.strictObject({
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

const createArticleSchema = z.strictObject({
  title: z.string().trim().min(5).max(255),
  content: z.string().trim().min(20).max(10000),
  topicId: z.uuid(),
});

const articleParamsSchema = z.strictObject({
  id: z.uuid(),
});

export const articlesController = {
  /**
   * GET /api/articles
   *
   * Retourne les articles triés par date.
   */
  async getAll(req: Request, res: Response) {
    const parsed = articlesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        error: "Paramètres de tri invalides.",
      });
      return;
    }

    try {
      const articles = await articlesService.getAll(parsed.data.sort);

      res.status(200).json({
        data: articles,
      });
    } catch (error) {
      console.error("Erreur de récupération des articles :", error);

      res.status(500).json({
        error: "Impossible de récupérer les articles.",
      });
    }
  },

  /**
   * POST /api/articles
   *
   * Crée un article pour l'utilisateur authentifié.
   */
  async create(req: Request, res: Response) {
    const authorId = req.session.userId;

    if (!authorId) {
      res.status(401).json({
        error: "Non authentifié.",
      });
      return;
    }

    const parsed = createArticleSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Les données de l'article sont invalides.",
      });
      return;
    }

    try {
      const article = await articlesService.create(authorId, parsed.data);

      res.status(201).json({
        message: "Article créé avec succès.",
        data: article,
      });
    } catch (error) {
      if (error instanceof ArticleTopicNotFoundError) {
        res.status(404).json({
          error: error.message,
        });
        return;
      }

      console.error("Erreur de création d'article :", error);

      res.status(500).json({
        error: "Impossible de créer l'article.",
      });
    }
  },

  /**
   * GET /api/articles/:id
   *
   * Récupère le détail d'un article existant.
   */
  async getById(req: Request, res: Response) {
    const parsed = articleParamsSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: "Identifiant d'article invalide.",
      });
      return;
    }

    try {
      const article = await articlesService.getById(parsed.data.id);

      res.status(200).json({
        data: article,
      });
    } catch (error) {
      if (error instanceof ArticleNotFoundError) {
        res.status(404).json({
          error: error.message,
        });
        return;
      }

      console.error("Erreur de consultation d'article :", error);

      res.status(500).json({
        error: "Impossible de récupérer l'article.",
      });
    }
  },
};
