import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/site-header";
import { ArticleDetails } from "@/features/articles/components/article-details";

type ArticlePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Consultation d'article | MDD",
  description: "Consultez un article de la communauté MDD.",
};

/**
 * Page de consultation d'un article.
 */
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <ArticleDetails key={id} articleId={id} />
      </main>
    </>
  );
}
