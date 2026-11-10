"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { postWithCsrf } from "@/lib/api-client";
import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const articleSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: z.object({
    username: z.string(),
  }),
  topic: z.object({
    name: z.string(),
  }),
  comments: z
    .array(
      z.object({
        id: z.uuid(),
        content: z.string(),
        createdAt: z.string(),
        author: z.object({
          username: z.string(),
        }),
      }),
    )
    .optional(),
});

const articleResponseSchema = z.object({
  data: articleSchema,
});

type Article = z.infer<typeof articleSchema>;

type LoadState =
  | { status: "loading" }
  | { status: "success"; article: Article }
  | { status: "error"; message: string };

type ArticleDetailsProps = {
  articleId: string;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/**
 * Affiche le détail d'un article et ses commentaires.
 */
export function ArticleDetails({ articleId }: ArticleDetailsProps) {
  const [state, setState] = useState<LoadState>({
    status: "loading",
  });
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [refreshComments, setRefreshComments] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadArticle() {
      try {
        const response = await fetch(`${API_URL}/api/articles/${articleId}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 404) {
          throw new Error("Cet article n'existe pas.");
        }

        if (response.status === 401) {
          throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
        }

        if (!response.ok) {
          throw new Error("Impossible de charger l'article.");
        }

        const json: unknown = await response.json();
        const parsed = articleResponseSchema.parse(json);

        if (!controller.signal.aborted) {
          setState({
            status: "success",
            article: parsed.data,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Une erreur inattendue est survenue.",
          });
        }
      }
    }

    void loadArticle();

    return () => controller.abort();
  }, [articleId, refreshComments]);

  /**
   * Publie un commentaire puis recharge les données
   * de l'article pour afficher le commentaire enregistré.
   */
  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingComment || state.status !== "success") {
      return;
    }

    const content = commentContent.trim();

    if (content.length < 1 || content.length > 2000) {
      setCommentError(
        "Le commentaire doit contenir entre 1 et 2 000 caractères.",
      );
      return;
    }

    setSubmittingComment(true);
    setCommentError(null);

    try {
      const response = await postWithCsrf(
        `/api/articles/${articleId}/comments`,
        { content },
      );

      if (response.status === 401) {
        throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
      }

      if (response.status === 403) {
        throw new Error("La vérification de sécurité a échoué.");
      }

      if (response.status === 404) {
        throw new Error("Cet article n'existe plus.");
      }

      if (!response.ok) {
        throw new Error("Impossible de publier le commentaire.");
      }

      // Réinitialisation uniquement après confirmation du serveur.
      setCommentContent("");

      // Recharge les commentaires depuis PostgreSQL.
      setRefreshComments((current) => current + 1);
    } catch (error) {
      setCommentError(
        error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue.",
      );
    } finally {
      setSubmittingComment(false);
    }
  }

  if (state.status === "loading") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Chargement de l&apos;article...
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="space-y-4">
        <p className="text-destructive">{state.message}</p>

        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="size-5" />
          Retour aux articles
        </Link>
      </div>
    );
  }

  const { article } = state;
  const comments = article.comments ?? [];

  return (
    <article className="mx-auto w-full max-w-3xl">
      {/* En-tête : flèche et titre */}
      <header className="mb-7">
        <div className="relative flex min-h-9 items-start justify-center sm:justify-start">
          <Link
            href="/articles"
            aria-label="Retour aux articles"
            className="absolute top-0 left-0 transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-7" aria-hidden="true" />
          </Link>

          <h1 className="px-10 text-center text-xl font-semibold sm:pr-0 sm:pl-12 sm:text-left">
            {article.title}
          </h1>
        </div>

        {/* Métadonnées */}
        <div className="mt-6 space-y-3 sm:ml-12">
          <div className="flex items-center gap-8 text-sm">
            <time dateTime={article.createdAt}>
              {dateFormatter.format(new Date(article.createdAt))}
            </time>

            <span>{article.author.username}</span>
          </div>

          <p className="text-sm">{article.topic.name}</p>
        </div>
      </header>

      {/* Contenu complet */}
      <div className="mb-8 whitespace-pre-wrap break-words text-sm leading-relaxed sm:ml-12 sm:text-base">
        {article.content}
      </div>

      {/* Séparateur */}
      <div className="mb-6 border-t border-border" />

      {/* Commentaires */}
      <section aria-labelledby="comments-heading" className="space-y-5">
        <h2 id="comments-heading" className="text-sm font-medium">
          Commentaires
        </h2>

        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun commentaire pour le moment.
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-5"
              >
                {/* Auteur : à gauche sur desktop */}
                <span className="hidden w-32 shrink-0 pt-2 text-right text-xs sm:block">
                  {comment.author.username}
                </span>

                {/* Auteur : au-dessus sur mobile */}
                <span className="text-right text-xs sm:hidden">
                  {comment.author.username}
                </span>

                {/* Bulle du commentaire */}
                <div className="min-w-0 flex-1 rounded-lg bg-muted p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Zone de rédaction : activée à l'étape Commentaires */}
        {/* Création d'un commentaire */}
        <div className="space-y-2 pt-2 sm:ml-12">
          {commentError && (
            <p role="alert" className="text-sm text-destructive">
              {commentError}
            </p>
          )}

          <form
            onSubmit={(event) => void handleCommentSubmit(event)}
            className="flex items-end gap-3"
          >
            <label htmlFor="new-comment" className="sr-only">
              Votre commentaire
            </label>

            <textarea
              id="new-comment"
              placeholder="Écrivez ici votre commentaire"
              rows={4}
              required
              maxLength={2000}
              value={commentContent}
              onChange={(event) => setCommentContent(event.target.value)}
              disabled={submittingComment}
              className="min-h-28 min-w-0 flex-1 resize-y rounded-lg border border-border bg-background p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={submittingComment || commentContent.trim().length === 0}
              aria-label="Envoyer le commentaire"
              title="Publier le commentaire"
              className="mb-2 shrink-0 text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="size-7" strokeWidth={2} aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>
    </article>
  );
}
