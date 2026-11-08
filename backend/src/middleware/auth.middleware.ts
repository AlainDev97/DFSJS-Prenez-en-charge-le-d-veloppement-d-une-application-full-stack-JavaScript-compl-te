import type { Request, Response, NextFunction } from "express";

/**
 * Protège les routes nécessitant une authentification.
 *
 * Vérifie la présence d'un identifiant utilisateur
 * dans la session Express.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session.userId) {
    res.status(401).json({
      error: "Non authentifié.",
    });
    return;
  }

  next();
}
