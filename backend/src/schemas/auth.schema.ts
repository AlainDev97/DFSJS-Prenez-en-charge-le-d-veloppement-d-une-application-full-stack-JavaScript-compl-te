import { z } from "zod";

/**
 * Valide et normalise les données d'inscription.
 *
 * Les propriétés inattendues sont rejetées.
 * Les mots de passe ne sont jamais modifiés automatiquement.
 */
export const registerSchema = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email().max(255)),

  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(50)
    .regex(
      /^[a-z0-9_]+$/,
      "Le pseudo doit contenir uniquement des lettres, chiffres ou underscores.",
    ),

  password: z.string().min(12).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
