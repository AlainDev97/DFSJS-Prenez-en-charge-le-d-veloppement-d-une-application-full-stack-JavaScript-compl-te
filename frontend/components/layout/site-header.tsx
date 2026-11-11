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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
   * Empêche le défilement de la page lorsque le menu est ouvert
   * et permet de fermer le panneau avec Échap.
   */
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

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
      setMobileMenuOpen(false);
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

        {status === "authenticated" && (
          <Link
            href="/profile"
            aria-current={pathname === "/profile" ? "page" : undefined}
            className={
              pathname === "/profile"
                ? "text-sm font-medium text-primary md:hidden"
                : "text-sm text-muted-foreground hover:text-primary md:hidden"
            }
          >
            Profil
          </Link>
        )}
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
            <Link
              href="/profile"
              aria-label={`Accéder au profil de ${username}`}
              aria-current={pathname === "/profile" ? "page" : undefined}
              className={
                "rounded-full border p-1 transition-colors " +
                (pathname === "/profile"
                  ? "border-primary text-primary"
                  : "border-border hover:border-primary hover:text-primary")
              }
            >
              <UserRound className="size-6" aria-hidden="true" />
            </Link>
          )}
        </nav>

        {/* Navigation mobile */}
        <div className="md:hidden">
          {/* Bouton hamburger */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="rounded-md p-2 hover:bg-muted"
          >
            <Menu className="size-7" aria-hidden="true" />
          </button>

          {mobileMenuOpen && (
            <>
              {/* Fond blanc transparent, comme sur la maquette */}
              <button
                type="button"
                aria-label="Fermer le menu mobile"
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-40 bg-background/70 md:hidden"
              />

              {/* Panneau latéral */}
              <aside
                id="mobile-navigation"
                aria-label="Menu de navigation mobile"
                className="fixed inset-y-0 right-0 z-50 flex h-dvh w-[58vw] min-w-52 max-w-72 flex-col border-l border-foreground/60 bg-background px-4 pb-5 pt-12 shadow-sm md:hidden"
              >
                {/* Liens du haut */}
                <nav
                  aria-label="Navigation principale mobile"
                  className="flex flex-col items-center gap-3 text-center"
                >
                  {status === "authenticated" ? (
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      disabled={isLoggingOut}
                      className="mb-1 text-sm font-semibold text-destructive hover:underline disabled:opacity-50"
                    >
                      {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
                    </button>
                  ) : status === "guest" ? (
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mb-1 text-sm font-semibold text-primary"
                    >
                      Se connecter
                    </Link>
                  ) : (
                    <span className="mb-1 text-sm text-muted-foreground">
                      Vérification...
                    </span>
                  )}

                  <Link
                    href="/articles"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={
                      pathname.startsWith("/articles") ? "page" : undefined
                    }
                    className="text-xl text-foreground hover:text-primary"
                  >
                    Articles
                  </Link>

                  <Link
                    href="/topics"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={
                      pathname.startsWith("/topics") ? "page" : undefined
                    }
                    className="text-xl text-foreground hover:text-primary"
                  >
                    Thèmes
                  </Link>
                </nav>

                {logoutError && (
                  <p
                    role="alert"
                    className="mt-4 text-center text-xs text-destructive"
                  >
                    {logoutError}
                  </p>
                )}

                {/* Profil positionné en bas à droite */}
                {status === "authenticated" && (
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label={`Accéder au profil de ${username}`}
                    aria-current={pathname === "/profile" ? "page" : undefined}
                    className={
                      "mt-auto ml-auto flex size-12 items-center justify-center rounded-full transition-colors " +
                      (pathname === "/profile"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-foreground hover:text-primary")
                    }
                  >
                    <UserRound
                      className="size-8"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </Link>
                )}
              </aside>
            </>
          )}
        </div>
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
