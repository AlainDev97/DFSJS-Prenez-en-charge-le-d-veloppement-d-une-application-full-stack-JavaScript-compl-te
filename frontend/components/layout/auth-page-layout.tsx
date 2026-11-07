import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type AuthPageLayoutProps = {
  title: string;
  children: ReactNode;
};

/**
 * Layout partagé des pages d'authentification.
 *
 * Reproduit les maquettes MDD :
 * - Desktop : logo dans le header.
 * - Mobile : logo centré au-dessus du formulaire.
 *
 * @param title - Titre de la page.
 * @param children - Formulaire à afficher.
 */
export function AuthPageLayout({ title, children }: AuthPageLayoutProps) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="hidden border-b sm:block">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-6">
          <Link href="/" aria-label="Accueil MDD">
            <Image
              src="/logo.png"
              alt="MDD - Monde de Dév"
              width={120}
              height={70}
              className="h-auto w-28"
              priority
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-12 pt-6 sm:pt-9">
        <Link
          href="/"
          aria-label="Retour à l'accueil"
          className="inline-flex rounded-md p-2 hover:bg-muted"
        >
          <ArrowLeft className="size-6" aria-hidden="true" />
        </Link>

        <div className="mx-auto mt-5 flex w-full max-w-sm flex-col items-center sm:mt-3">
          <div className="mb-4 sm:hidden">
            <Image
              src="/logo.png"
              alt="MDD - Monde de Dév"
              width={160}
              height={90}
              className="h-auto w-40"
              priority
            />
          </div>

          <h1 className="mb-7 text-xl font-medium">{title}</h1>

          {children}
        </div>
      </main>
    </div>
  );
}
