import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Vérifie la session Express côté serveur
 * avant d'autoriser l'affichage d'une page publique.
 */
export async function redirectIfAuthenticated(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("mdd.sid");

  // Aucune session : l'utilisateur peut accéder à la page.
  if (!sessionCookie) {
    return;
  }

  const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

  const response = await fetch(`${apiUrl}/api/auth/me`, {
    headers: {
      Cookie: `mdd.sid=${encodeURIComponent(sessionCookie.value)}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    return;
  }

  if (!response.ok) {
    throw new Error("Impossible de vérifier la session.");
  }

  redirect("/topics");
}
