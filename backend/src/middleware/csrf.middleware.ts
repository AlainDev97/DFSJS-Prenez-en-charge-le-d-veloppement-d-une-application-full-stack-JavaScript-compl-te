import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Génère un jeton CSRF pour la session courante.
 *
 * Le jeton est conservé côté serveur dans la session.
 */
export function getCsrfToken(req: Request, res: Response): void {
  if (!req.session.csrfToken) {
    req.session.csrfToken = randomBytes(32).toString("hex");
  }

  res.setHeader("Cache-Control", "no-store");

  res.status(200).json({
    csrfToken: req.session.csrfToken,
  });
}

/**
 * Vérifie le jeton CSRF pour les requêtes
 * qui modifient l'état de l'application.
 */
export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const token = req.get("X-CSRF-Token");
  const expected = req.session.csrfToken;

  if (
    !token ||
    !expected ||
    !/^[0-9a-f]{64}$/.test(token) ||
    !/^[0-9a-f]{64}$/.test(expected)
  ) {
    res.status(403).json({
      error: "Jeton CSRF invalide ou manquant.",
    });
    return;
  }

  const valid = timingSafeEqual(
    Buffer.from(token, "hex"),
    Buffer.from(expected, "hex"),
  );

  if (!valid) {
    res.status(403).json({
      error: "Jeton CSRF invalide ou manquant.",
    });
    return;
  }

  next();
}
