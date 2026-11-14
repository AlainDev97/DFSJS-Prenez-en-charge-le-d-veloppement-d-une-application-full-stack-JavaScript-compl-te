import Link from "next/link";
import Image from "next/image";

import { redirectIfAuthenticated } from "@/lib/redirect-if-authenticated";
import logo from "@/public/logo.png";

export default async function Home() {
  await redirectIfAuthenticated();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="flex w-full flex-col items-center gap-6 sm:gap-8">
        <Image
          src={logo}
          alt="Logo"
          priority
          className="h-32.5 w-56.25 object-contain sm:h-59.5 sm:w-103"
        />

        <div className="flex w-full max-w-[320px] flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-16">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Se connecter
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-6 py-3 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            S&apos;inscrire
          </Link>
        </div>
      </div>
    </main>
  );
}
