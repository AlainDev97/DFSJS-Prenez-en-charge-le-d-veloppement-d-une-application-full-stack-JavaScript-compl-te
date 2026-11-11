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

/**
 * Valide les identifiants de connexion.
 */
export const loginSchema = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email().max(255)),

  password: z.string().min(1).max(128),
});

/**
 * Validation de la mise à jour du profil.
 * Le mot de passe actuel confirme l'opération.
 */
export const updateProfileSchema = z.strictObject({
  username: registerSchema.shape.username,
  email: registerSchema.shape.email,
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
