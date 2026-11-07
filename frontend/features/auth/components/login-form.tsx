"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const loginSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Adresse e-mail invalide.").max(255)),

  password: z
    .string()
    .min(1, "Le mot de passe est obligatoire.")
    .max(128, "Le mot de passe est trop long."),
});

type FieldErrors = {
  email?: string;
  password?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Formulaire de connexion à MDD.
 *
 * Envoie les identifiants à Express et autorise
 * la réception du cookie de session HttpOnly.
 */
export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Valide les identifiants et demande l'ouverture
   * d'une session auprès de l'API Express.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setErrors({});
    setServerError(null);

    const parsed = loginSchema.safeParse({
      email,
      password,
    });

    if (!parsed.success) {
      setErrors({
        email: parsed.error.issues.find((issue) => issue.path[0] === "email")
          ?.message,

        password: parsed.error.issues.find(
          (issue) => issue.path[0] === "password",
        )?.message,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(parsed.data),
      });

      if (response.status === 401) {
        setServerError("Email ou mot de passe incorrect.");
        return;
      }

      if (response.status === 400) {
        setServerError("Identifiants invalides.");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      router.replace("/topics");
    } catch {
      setServerError("Impossible de se connecter. Veuillez réessayer.");
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
      <div className="space-y-1.5">
        <label htmlFor="login-email" className="text-sm font-medium">
          Adresse e-mail
        </label>

        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((previous) => ({
              ...previous,
              email: undefined,
            }));
            setServerError(null);
          }}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className={inputClassName}
        />

        {errors.email && (
          <p id="login-email-error" className="text-xs text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-password" className="text-sm font-medium">
          Mot de passe
        </label>

        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((previous) => ({
              ...previous,
              password: undefined,
            }));
            setServerError(null);
          }}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? "login-password-error" : undefined
          }
          className={inputClassName}
        />

        {errors.password && (
          <p id="login-password-error" className="text-xs text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="text-center text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex justify-center pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-w-32 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </button>
      </div>
    </form>
  );
}
