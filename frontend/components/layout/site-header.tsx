import Link from "next/link";
import Image from "next/image";
import { Menu, UserRound } from "lucide-react";

export function SiteHeader() {
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

        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-6 md:flex"
        >
          <span className="text-xs text-muted-foreground">Se déconnecter</span>

          <span className="text-sm text-muted-foreground">Articles</span>

          <Link
            href="/topics"
            aria-current="page"
            className="text-sm font-medium text-primary"
          >
            Thèmes
          </Link>

          <UserRound
            className="size-7 rounded-full bg-muted p-1"
            aria-hidden="true"
          />
        </nav>

        <details className="relative md:hidden">
          <summary className="cursor-pointer list-none rounded-lg p-2 hover:bg-muted">
            <Menu className="size-6" aria-hidden="true" />
            <span className="sr-only">Ouvrir le menu</span>
          </summary>

          <nav
            aria-label="Navigation mobile"
            className="absolute right-0 top-full z-20 mt-3 flex w-44 flex-col gap-4 rounded-lg border bg-background p-5 shadow-lg"
          >
            <span className="text-xs text-muted-foreground">
              Se déconnecter
            </span>

            <span className="text-sm text-muted-foreground">Articles</span>

            <Link
              href="/topics"
              aria-current="page"
              className="text-sm font-medium text-primary"
            >
              Thèmes
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
