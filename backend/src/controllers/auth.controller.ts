import type { Request, Response } from "express";

import { registerSchema } from "../schemas/auth.schema.js";
import {
  authService,
  UserAlreadyExistsError,
} from "../services/auth.service.js";

export const authController = {
  /**
   * Traite une inscription HTTP.
   *
   * @param req - Requête contenant les données du compte.
   * @param res - Réponse HTTP envoyée au client.
   */
  async register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Données d'inscription invalides.",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const user = await authService.register(parsed.data);

      res.status(201).json({
        message: "Compte créé avec succès.",
        data: user,
      });
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        res.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("Erreur lors de l'inscription :", error);

      res.status(500).json({
        error: "Une erreur interne est survenue.",
      });
    }
  },
};
