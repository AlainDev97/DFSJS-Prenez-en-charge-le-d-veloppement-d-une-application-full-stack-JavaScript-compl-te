import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Politique de confidentialité | MDD",
  description: "Protection des données personnelles sur Monde de Dév.",
};

/**
 * Présente les données collectées, leurs finalités
 * et les mesures de protection mises en place.
 */
export default function PrivacyPage() {
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

      <h1 className="mb-8 text-3xl font-semibold">
        Politique de confidentialité
      </h1>

      <div className="space-y-8 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Présentation</h2>

          <p>
            MDD (Monde de Dév) est une application réalisée dans le cadre de la
            formation Lead Developer JavaScript d&apos;OpenClassrooms.
          </p>

          <p>
            Cette politique présente les traitements de données personnelles
            effectués dans le cadre de son fonctionnement pédagogique.
          </p>

          <p>Responsable du projet : Alain Bonneau.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Données collectées</h2>

          <p>
            Les données nécessaires au fonctionnement de l&apos;application
            comprennent :
          </p>

          <ul className="list-disc space-y-1 pl-6">
            <li>Adresse e-mail et pseudonyme.</li>
            <li>Identifiant unique du compte.</li>
            <li>Mot de passe sous forme hachée.</li>
            <li>Articles et commentaires publiés.</li>
            <li>Abonnements aux thèmes.</li>
            <li>Dates de création et de modification.</li>
            <li>Données techniques de session.</li>
            <li>
              Adresse IP utilisée pour limiter les tentatives de connexion et
              d&apos;inscription.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            3. Finalités des traitements
          </h2>

          <p>Ces données permettent de :</p>

          <ul className="list-disc space-y-1 pl-6">
            <li>Créer et gérer les comptes utilisateurs.</li>
            <li>Authentifier les utilisateurs.</li>
            <li>Personnaliser le fil d&apos;actualité.</li>
            <li>Gérer les articles et les commentaires.</li>
            <li>Enregistrer les abonnements aux thèmes.</li>
            <li>Assurer la sécurité de l&apos;application.</li>
          </ul>

          <p>
            Le projet pédagogique ne prévoit aucune exploitation commerciale des
            données.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Cookies et sessions</h2>

          <p>
            MDD utilise un cookie technique nommé <code>mdd.sid</code>,
            nécessaire à la gestion des sessions et à l&apos;authentification.
          </p>

          <p>
            Sa durée de validité configurée est de sept jours. La déconnexion
            invalide la session côté serveur.
          </p>

          <p>
            Ce cookie utilise les attributs HttpOnly et SameSite Lax.
            L&apos;attribut Secure est activé lorsque le back-end fonctionne en
            production.
          </p>

          <p>Aucun usage publicitaire de ce cookie n&apos;est prévu.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            5. Conservation et accès aux données
          </h2>

          <p>
            Les données sont stockées dans une base PostgreSQL. Dans la
            configuration pédagogique actuelle, cette base est hébergée
            localement.
          </p>

          <p>
            Les articles, commentaires et pseudonymes associés peuvent être
            consultés par les utilisateurs authentifiés selon les
            fonctionnalités de MDD.
          </p>

          <p>
            La version actuelle ne prévoit pas de suppression automatique des
            comptes et de leurs contenus. Les durées de conservation définitives
            devront être définies avant toute mise en ligne publique.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Sécurité des données</h2>

          <ul className="list-disc space-y-1 pl-6">
            <li>Hachage des mots de passe avec Argon2.</li>
            <li>Validation des données avec Zod.</li>
            <li>Protection des routes privées.</li>
            <li>Protection contre les attaques CSRF.</li>
            <li>Limitation des tentatives de connexion.</li>
            <li>Stockage des sessions côté serveur.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Droits des utilisateurs</h2>

          <p>
            Conformément au Règlement général sur la protection des données
            (RGPD), les personnes disposent, selon les conditions applicables,
            de droits concernant leurs données personnelles :
          </p>

          <ul className="list-disc space-y-1 pl-6">
            <li>Droit d&apos;accès.</li>
            <li>Droit de rectification.</li>
            <li>Droit à l&apos;effacement.</li>
            <li>Droit à la limitation du traitement.</li>
            <li>Droit d&apos;opposition.</li>
            <li>Droit à la portabilité.</li>
          </ul>

          <p>
            La page Profil permet de consulter et de modifier certaines
            informations du compte.
          </p>

          <p>
            Un moyen de contact dédié à l&apos;exercice des autres droits devra
            être mis en place avant toute ouverture publique du service.
          </p>

          <p>
            Pour obtenir davantage d&apos;informations ou introduire une
            réclamation, les utilisateurs peuvent consulter le site de la{" "}
            <a
              href="https://www.cnil.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              CNIL
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
