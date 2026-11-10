"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const articleSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  excerpt: z.string(),
  createdAt: z.string(),
  author: z.object({
    username: z.string(),
  }),
  topic: z.object({
    name: z.string(),
  }),
});

const articlesResponseSchema = z.object({
  data: z.array(articleSchema),
});

type Article = z.infer<typeof articleSchema>;
type ArticleSort = "newest" | "oldest";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/**
 * Affiche les articles et permet de les trier par date.
 */
export function ArticlesList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [sort, setSort] = useState<ArticleSort>("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadArticles() {
      try {
        const response = await fetch(`${API_URL}/api/articles?sort=${sort}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
        }

        if (!response.ok) {
          throw new Error("Impossible de charger les articles.");
        }

        const json: unknown = await response.json();
        const parsed = articlesResponseSchema.parse(json);

        if (!controller.signal.aborted) {
          setArticles(parsed.data);
          setError(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setArticles([]);

          setError(
            error instanceof Error && error.message.startsWith("Votre session")
              ? error.message
              : "Impossible de charger les articles.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadArticles();

    return () => controller.abort();
  }, [sort, retry]);

  /**
   * Inverse le tri chronologique.
   */
  function toggleSort() {
    setLoading(true);
    setError(null);

    setSort((current) => (current === "newest" ? "oldest" : "newest"));
  }

  /**
   * Relance le chargement après une erreur.
   */
  function handleRetry() {
    setLoading(true);
    setError(null);
    setRetry((current) => current + 1);
  }

  return (
    <section aria-label="Liste des articles">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/articles/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Créer un article
        </Link>

        <button
          type="button"
          onClick={toggleSort}
          disabled={loading}
          aria-label={
            sort === "newest"
              ? "Tri décroissant. Cliquer pour afficher les plus anciens d'abord."
              : "Tri croissant. Cliquer pour afficher les plus récents d'abord."
          }
          className="flex items-center gap-2 text-sm font-medium hover:text-primary disabled:opacity-50"
        >
          Trier par
          {sort === "newest" ? (
            <ArrowDown className="size-4" aria-hidden="true" />
          ) : (
            <ArrowUp className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {loading && (
        <p role="status" className="text-sm text-muted-foreground">
          Chargement des articles...
        </p>
      )}

      {!loading && error && (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-destructive">{error}</p>

          <button
            type="button"
            onClick={handleRetry}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun article disponible pour le moment.
        </p>
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {articles.map((article) => (
            <article key={article.id}>
              <Link
                href={`/articles/${article.id}`}
                className="block min-h-44 rounded-lg bg-muted p-4 transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <h2 className="mb-3 text-base font-semibold">
                  {article.title}
                </h2>

                <div className="mb-3 flex items-center justify-between gap-3 text-xs">
                  <time dateTime={article.createdAt}>
                    {dateFormatter.format(new Date(article.createdAt))}
                  </time>

                  <span className="truncate">{article.author.username}</span>
                </div>

                <p className="line-clamp-4 whitespace-pre-line break-words text-sm leading-relaxed">
                  {article.excerpt}
                </p>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
