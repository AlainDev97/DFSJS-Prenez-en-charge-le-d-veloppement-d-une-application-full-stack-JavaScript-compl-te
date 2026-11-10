import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/site-header";
import { ArticlesList } from "@/features/articles/components/articles-list";

export const metadata: Metadata = {
  title: "Articles | MDD",
  description: "Découvrez les articles de la communauté MDD.",
};

/**
 * Page des articles accessible aux utilisateurs authentifiés.
 */
export default function ArticlesPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="sr-only">Articles</h1>
        <ArticlesList />
      </main>
    </>
  );
}
