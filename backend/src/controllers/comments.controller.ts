import type { Request, Response } from "express";
import { z } from "zod";

import {
  commentsService,
  CommentArticleNotFoundError,
} from "../services/comments.service.js";

const commentParamsSchema = z.strictObject({
  id: z.uuid(),
});

const createCommentSchema = z.strictObject({
  content: z.string().trim().min(1).max(2000),
});

export const commentsController = {
  /**
   * POST /api/articles/:id/comments
   *
   * Publie un commentaire pour l'utilisateur connecté.
   */
  async create(req: Request, res: Response) {
    const authorId = req.session.userId;

    if (!authorId) {
      res.status(401).json({
        error: "Non authentifié.",
      });
      return;
    }

    const params = commentParamsSchema.safeParse(req.params);
    const body = createCommentSchema.safeParse(req.body);

    if (!params.success || !body.success) {
      res.status(400).json({
        error: "Données du commentaire invalides.",
      });
      return;
    }

    try {
      const comment = await commentsService.create(
        authorId,
        params.data.id,
        body.data.content,
      );

      res.status(201).json({
        message: "Commentaire publié avec succès.",
        data: comment,
      });
    } catch (error) {
      if (error instanceof CommentArticleNotFoundError) {
        res.status(404).json({
          error: error.message,
        });
        return;
      }

      console.error("Erreur de création du commentaire :", error);

      res.status(500).json({
        error: "Impossible de publier le commentaire.",
      });
    }
  },
};
