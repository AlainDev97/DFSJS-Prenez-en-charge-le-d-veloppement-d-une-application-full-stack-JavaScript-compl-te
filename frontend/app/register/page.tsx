import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Inscription | MDD",
  description: "Créez votre compte Monde de Dév.",
};

/**
 * Page d'inscription responsive.
 *
 * Adapte la position du logo et du formulaire
 * aux maquettes desktop et mobile de MDD.
 */
export default function RegisterPage() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Header desktop */}
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
        {/* Retour à l'accueil */}
        <Link
          href="/"
          aria-label="Retour à l'accueil"
          className="inline-flex rounded-md p-2 transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-6" aria-hidden="true" />
        </Link>

        <div className="mx-auto mt-5 flex w-full max-w-sm flex-col items-center sm:mt-3">
          {/* Logo mobile */}
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

          <h1 className="mb-7 text-xl font-medium">Inscription</h1>

          <RegisterForm />
        </div>
      </main>
    </div>
  );
}
