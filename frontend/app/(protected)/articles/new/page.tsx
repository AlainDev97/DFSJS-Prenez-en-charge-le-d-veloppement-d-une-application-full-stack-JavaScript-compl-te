import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/site-header";
import { CreateArticleForm } from "@/features/articles/components/create-article-form";

export const metadata: Metadata = {
  title: "Créer un article | MDD",
  description: "Publiez un article sur MDD.",
};

/**
 * Page de création d'article.
 * Protégée par le layout (protected).
 */
export default function NewArticlePage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <CreateArticleForm />
      </main>
    </>
  );
}
