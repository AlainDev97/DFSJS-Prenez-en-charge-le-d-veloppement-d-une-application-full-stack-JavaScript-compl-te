import type { ErrorRequestHandler } from "express";

/**
 * Centralise les erreurs inattendues de l'API.
 * Ne transmet jamais les détails techniques au client.
 */
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  // Préserve les erreurs HTTP 4xx, notamment le JSON invalide.
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 500
      ? error.status
      : 500;

  if (status >= 500) {
    console.error(`[${req.method} ${req.path}] Erreur interne :`, error);
  }

  res.status(status).json({
    error:
      status >= 500 ? "Une erreur interne est survenue." : "Requête invalide.",
  });
};
