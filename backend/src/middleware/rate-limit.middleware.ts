import { rateLimit } from "express-rate-limit";

/**
 * Limite les tentatives de connexion à 10 échecs
 * par adresse IP sur une période de 15 minutes.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Trop de tentatives. Réessayez plus tard.",
  },
});

/**
 * Limite les inscriptions à 5 requêtes
 * par adresse IP sur une période d'une heure.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Trop d'inscriptions. Réessayez plus tard.",
  },
});
