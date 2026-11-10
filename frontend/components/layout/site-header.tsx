"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { postWithCsrf } from "@/lib/api-client";
import { Menu, UserRound } from "lucide-react";
import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const currentUserSchema = z.object({
  data: z.object({
    id: z.uuid(),
    email: z.email(),
    username: z.string(),
  }),
});

type AuthStatus = "loading" | "authenticated" | "guest" | "error";

/**
 * Navigation principale de MDD.
 *
 * Consulte la session Express et affiche les actions
 * adaptées à l'état d'authentification.
 */
export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState<AuthStatus>("loading");
  const [username, setUsername] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  /**
   * Vérifie la session existante auprès de l'API Express.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadCurrentUser() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (response.status === 401) {
          setStatus("guest");
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json: unknown = await response.json();
        const parsed = currentUserSchema.safeParse(json);

        if (!parsed.success) {
          throw new Error("Réponse utilisateur invalide.");
        }

        if (!controller.signal.aborted) {
          setUsername(parsed.data.data.username);
          setStatus("authenticated");
        }
      } catch {
        if (!controller.signal.aborted) {
          setStatus("error");
        }
      }
    }

    void loadCurrentUser();

    return () => controller.abort();
  }, []);

  /**
   * Détruit la session et redirige vers la connexion.
   */
  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      const response = await postWithCsrf("/api/auth/logout");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setUsername(null);
      setStatus("guest");
      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError("Impossible de se déconnecter. Réessayez.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  /**
   * Affiche les liens de navigation selon la session.
   * Utilisé dans les menus desktop et mobile.
   */
  function renderNavigation() {
    return (
      <>
        {status === "authenticated" ? (
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="text-sm text-destructive hover:underline disabled:opacity-60"
          >
            {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
          </button>
        ) : status === "guest" ? (
          <Link href="/login" className="text-sm hover:underline">
            Se connecter
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">
            {status === "loading" ? "Vérification..." : "Session indisponible"}
          </span>
        )}

        <Link
          href="/articles"
          aria-current={pathname.startsWith("/articles") ? "page" : undefined}
          className={
            pathname.startsWith("/articles")
              ? "text-sm font-medium text-primary"
              : "text-sm text-muted-foreground hover:text-primary"
          }
        >
          Articles
        </Link>

        <Link
          href="/topics"
          aria-current={pathname.startsWith("/topics") ? "page" : undefined}
          className={
            pathname.startsWith("/topics")
              ? "text-sm font-medium text-primary"
              : "text-sm text-muted-foreground hover:text-primary"
          }
        >
          Thèmes
        </Link>
      </>
    );
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" aria-label="MDD - Accueil" className="flex items-center">
          <Image
            src="/logo.png"
            alt="MDD - Monde de Dév"
            width={140}
            height={80}
            className="object-contain"
            priority
          />
        </Link>

        {/* Navigation desktop */}
        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-6 md:flex"
        >
          {renderNavigation()}

          {status === "authenticated" && (
            <UserRound
              aria-label={`Connecté : ${username}`}
              className="size-7 rounded-full bg-muted p-1"
            />
          )}
        </nav>

        {/* Navigation mobile */}
        <details className="relative md:hidden">
          <summary className="cursor-pointer list-none rounded-lg p-2 hover:bg-muted">
            <Menu className="size-6" aria-hidden="true" />
            <span className="sr-only">Ouvrir le menu</span>
          </summary>

          <nav
            aria-label="Navigation mobile"
            className="absolute right-0 top-full z-20 mt-3 flex w-44 flex-col gap-4 rounded-lg border bg-background p-5 shadow-lg"
          >
            {status === "authenticated" && (
              <p className="text-xs text-muted-foreground">
                Connecté : {username}
              </p>
            )}

            {renderNavigation()}
          </nav>
        </details>
      </div>

      {logoutError && (
        <p
          role="alert"
          className="mx-auto max-w-5xl px-4 pb-2 text-sm text-destructive"
        >
          {logoutError}
        </p>
      )}
    </header>
  );
}
