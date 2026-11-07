"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";

// Schéma de validation du formulaire d'inscription.
const registerSchema = z.strictObject({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Le pseudo doit contenir au moins 3 caractères.")
    .max(50, "Le pseudo est trop long.")
    .regex(
      /^[a-z0-9_]+$/,
      "Utilisez uniquement des lettres, chiffres et underscores.",
    ),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Adresse e-mail invalide.").max(255)),

  password: z
    .string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères.")
    .max(128, "Le mot de passe est trop long."),
});

type RegisterFormValues = {
  username: string;
  email: string;
  password: string;
};

type FieldName = keyof RegisterFormValues;

type FieldErrors = Partial<Record<FieldName, string>>;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Formulaire d'inscription MDD.
 *
 * Valide les entrées et contacte l'API REST Express.
 * Aucun mot de passe n'est stocké dans le navigateur.
 */
export function RegisterForm() {
  const [form, setForm] = useState<RegisterFormValues>({
    username: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Met à jour un champ et efface son erreur précédente.
   */
  function updateField(field: FieldName, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));

    setServerError(null);
    setSuccess(false);
  }

  /**
   * Valide les données puis soumet l'inscription à Express.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setServerError(null);
    setSuccess(false);

    const parsed = registerSchema.safeParse(form);

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (field === "username" || field === "email" || field === "password") {
          fieldErrors[field] ??= issue.message;
        }
      }

      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      if (response.status === 409) {
        setServerError("Cette adresse e-mail ou ce pseudo est déjà utilisé.");
        return;
      }

      if (response.status === 400) {
        setServerError("Les informations fournies sont invalides.");
        return;
      }

      if (response.status !== 201) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      setSuccess(true);
      setForm({
        username: "",
        email: "",
        password: "",
      });
    } catch {
      setServerError("Impossible de créer le compte. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "h-11 w-full rounded-md border border-input " +
    "bg-background px-3 text-sm outline-none " +
    "focus-visible:ring-2 focus-visible:ring-ring " +
    "aria-invalid:border-destructive";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-xs space-y-5"
    >
      {/* Nom d'utilisateur */}
      <div className="space-y-1.5">
        <label htmlFor="username" className="text-sm font-medium">
          Nom d&apos;utilisateur
        </label>

        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          maxLength={50}
          value={form.username}
          onChange={(event) => updateField("username", event.target.value)}
          aria-invalid={Boolean(errors.username)}
          aria-describedby={errors.username ? "username-error" : undefined}
          className={inputClassName}
        />

        {errors.username && (
          <p id="username-error" className="text-xs text-destructive">
            {errors.username}
          </p>
        )}
      </div>

      {/* Adresse e-mail */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Adresse e-mail
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={255}
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={inputClassName}
        />

        {errors.email && (
          <p id="email-error" className="text-xs text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      {/* Mot de passe */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Mot de passe
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          className={inputClassName}
        />

        {errors.password && (
          <p id="password-error" className="text-xs text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      {/* Erreurs de l'API */}
      {serverError && (
        <p role="alert" className="text-center text-sm text-destructive">
          {serverError}
        </p>
      )}

      {/* Confirmation */}
      {success && (
        <p
          role="status"
          className="text-center text-sm text-green-700 dark:text-green-400"
        >
          Compte créé avec succès ! La connexion sera bientôt disponible.
        </p>
      )}

      <div className="flex justify-center pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-w-32 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Inscription..." : "S'inscrire"}
        </button>
      </div>
    </form>
  );
}
