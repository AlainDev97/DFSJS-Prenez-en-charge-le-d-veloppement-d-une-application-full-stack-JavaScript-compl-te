import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Mentions légales | MDD",
  description: "Mentions légales de Monde de Dév.",
};

/**
 * Présente les informations légales relatives
 * au projet pédagogique MDD.
 */
export default function LegalPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm
          font-medium hover:text-primary"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
        Retour à l&apos;accueil
      </Link>

      <h1 className="mb-8 text-3xl font-semibold">Mentions légales</h1>

      <div className="space-y-8 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Présentation du site</h2>

          <p>
            MDD (Monde de Dév) est une application web communautaire destinée
            aux développeurs, réalisée dans le cadre du projet P5 de la
            formation Lead Developer JavaScript (RNCP 7) d&apos;OpenClassrooms.
          </p>

          <p>
            Cette application est un projet pédagogique à vocation non
            commerciale.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Éditeur du site</h2>

          <p>Responsable du projet : Alain Bonneau.</p>

          <p>
            Le projet est développé dans le cadre d&apos;une formation
            professionnelle.
          </p>

          <p>
            Dépôt du projet :{" "}
            <a
              href="https://github.com/AlainDev97/DFSJS-Prenez-en-charge-le-d-veloppement-d-une-application-full-stack-JavaScript-compl-te"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              GitHub - MDD
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Hébergement</h2>

          <p>
            Dans sa configuration pédagogique actuelle, l&apos;application est
            exécutée dans un environnement local avec Next.js, Express et
            PostgreSQL.
          </p>

          <p>
            Les informations relatives à un éventuel hébergeur seront précisées
            avant toute mise en ligne publique.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Propriété intellectuelle</h2>

          <p>
            Les maquettes et ressources pédagogiques fournies dans le cadre de
            la formation restent soumises aux droits de leurs titulaires
            respectifs.
          </p>

          <p>
            Les utilisateurs doivent respecter les droits de propriété
            intellectuelle lors de la publication de leurs articles et
            commentaires.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            5. Contenus et responsabilité
          </h2>

          <p>
            Les utilisateurs sont responsables des contenus qu&apos;ils publient
            sur la plateforme. Les contenus illicites, discriminatoires,
            diffamatoires ou portant atteinte aux droits de tiers sont
            interdits.
          </p>

          <p>
            L&apos;application étant destinée à un usage pédagogique, des
            interruptions ou anomalies techniques peuvent survenir.
          </p>
        </section>
      </div>
    </main>
  );
}
