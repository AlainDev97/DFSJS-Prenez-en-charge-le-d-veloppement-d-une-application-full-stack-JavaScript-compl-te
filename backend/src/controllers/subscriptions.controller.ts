import type { Request, Response } from "express";
import { z } from "zod";

import {
  subscriptionsService,
  AlreadySubscribedError,
  TopicNotFoundError,
} from "../services/subscriptions.service.js";

const subscriptionSchema = z.strictObject({
  topicId: z.uuid(),
});

const paramsSchema = z.strictObject({
  topicId: z.uuid(),
});

export const subscriptionsController = {
  /**
   * GET /api/subscriptions
   * Liste les abonnements de l'utilisateur connecté.
   */
  async getAll(req: Request, res: Response) {
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({ error: "Non authentifié." });
      return;
    }

    try {
      const subscriptions = await subscriptionsService.getByUser(userId);

      res.status(200).json({
        data: subscriptions,
      });
    } catch (error) {
      console.error("Erreur de lecture des abonnements :", error);
      res.status(500).json({
        error: "Impossible de récupérer les abonnements.",
      });
    }
  },

  /**
   * POST /api/subscriptions
   * Abonne l'utilisateur au thème fourni.
   */
  async subscribe(req: Request, res: Response) {
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({ error: "Non authentifié." });
      return;
    }

    const parsed = subscriptionSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Identifiant du thème invalide.",
      });
      return;
    }

    try {
      const subscription = await subscriptionsService.subscribe(
        userId,
        parsed.data.topicId,
      );

      res.status(201).json({
        message: "Abonnement créé.",
        data: subscription,
      });
    } catch (error) {
      if (error instanceof TopicNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error instanceof AlreadySubscribedError) {
        res.status(409).json({ error: error.message });
        return;
      }

      console.error("Erreur de création d'abonnement :", error);

      res.status(500).json({
        error: "Impossible de créer l'abonnement.",
      });
    }
  },

  /**
   * DELETE /api/subscriptions/:topicId
   * Désabonne l'utilisateur du thème.
   */
  async unsubscribe(req: Request, res: Response) {
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({ error: "Non authentifié." });
      return;
    }

    const parsed = paramsSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: "Identifiant du thème invalide.",
      });
      return;
    }

    try {
      await subscriptionsService.unsubscribe(userId, parsed.data.topicId);

      res.status(204).end();
    } catch (error) {
      console.error("Erreur de suppression d'abonnement :", error);

      res.status(500).json({
        error: "Impossible de supprimer l'abonnement.",
      });
    }
  },
};
