import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

type ProtectedLayoutProps = {
  children: ReactNode;
};

/**
 * Vérifie la session Express avant d'autoriser
 * l'accès aux pages privées de MDD.
 */
export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("mdd.sid");

  if (!sessionCookie) {
    redirect("/login");
  }

  const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

  const response = await fetch(`${apiUrl}/api/auth/me`, {
    headers: {
      Cookie: `mdd.sid=${encodeURIComponent(sessionCookie.value)}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error("Impossible de vérifier la session.");
  }

  return <>{children}</>;
}
