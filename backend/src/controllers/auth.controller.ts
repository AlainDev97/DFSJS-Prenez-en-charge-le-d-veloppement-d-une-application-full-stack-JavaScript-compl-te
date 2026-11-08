import type { Request, Response } from "express";

import { registerSchema } from "../schemas/auth.schema.js";
import { loginSchema } from "../schemas/auth.schema.js";
import {
  authService,
  UserAlreadyExistsError,
  InvalidCredentialsError,
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

  /**
   * Authentifie l'utilisateur et crée une session serveur.
   */
  async login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Identifiants invalides.",
      });
      return;
    }

    try {
      const user = await authService.login(parsed.data);

      // Régénère l'identifiant de session après authentification.
      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      req.session.userId = user.id;

      await new Promise<void>((resolve, reject) => {
        req.session.save((error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      res.status(200).json({
        message: "Connexion réussie.",
        data: user,
      });
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        res.status(401).json({
          error: error.message,
        });
        return;
      }

      console.error("Erreur lors de la connexion :", error);

      res.status(500).json({
        error: "Une erreur interne est survenue.",
      });
    }
  },

  /**
   * Renvoie les informations de l'utilisateur connecté.
   */
  async me(req: Request, res: Response) {
    if (!req.session.userId) {
      res.status(401).json({
        error: "Non authentifié.",
      });
      return;
    }

    try {
      const user = await authService.getCurrentUser(req.session.userId);

      if (!user) {
        res.status(401).json({
          error: "Session invalide.",
        });
        return;
      }

      res.status(200).json({ data: user });
    } catch (error) {
      console.error("Erreur de récupération du profil :", error);

      res.status(500).json({
        error: "Une erreur interne est survenue.",
      });
    }
  },

  /**
   * Déconnecte l'utilisateur en invalidant sa session serveur.
   *
   * @param req - Requête contenant la session active.
   * @param res - Réponse HTTP.
   */
  async logout(req: Request, res: Response) {
    try {
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      res.clearCookie("mdd.sid", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      res.status(204).end();
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);

      res.status(500).json({
        error: "Impossible de terminer la session.",
      });
    }
  },
};
