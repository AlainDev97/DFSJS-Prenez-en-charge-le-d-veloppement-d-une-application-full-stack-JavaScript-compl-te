import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const csrfResponseSchema = z.object({
  csrfToken: z.string().regex(/^[0-9a-f]{64}$/),
});

/**
 * Envoie une requête POST protégée par un jeton CSRF.
 *
 * @param endpoint - Endpoint relatif de l'API.
 * @param data - Corps JSON facultatif.
 * @returns Réponse HTTP de l'API Express.
 */
export async function postWithCsrf(
  endpoint: string,
  data?: unknown,
): Promise<Response> {
  if (!endpoint.startsWith("/api/")) {
    throw new Error("Endpoint API invalide.");
  }

  const csrfResponse = await fetch(`${API_URL}/api/auth/csrf`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!csrfResponse.ok) {
    throw new Error("Impossible de récupérer le jeton CSRF.");
  }

  const json: unknown = await csrfResponse.json();
  const { csrfToken } = csrfResponseSchema.parse(json);

  return fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "X-CSRF-Token": csrfToken,
      ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
}
