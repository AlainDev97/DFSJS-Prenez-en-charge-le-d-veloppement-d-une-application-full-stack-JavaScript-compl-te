"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

import { postWithCsrf } from "@/lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const topicsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
    }),
  ),
});

const createArticleSchema = z.strictObject({
  title: z.string().trim().min(5).max(255),
  content: z.string().trim().min(20).max(10000),
  topicId: z.uuid(),
});

type Topic = z.infer<typeof topicsResponseSchema>["data"][number];

/**
 * Formulaire de création d'article.
 *
 * Les données sont validées côté client puis transmises
 * à l'API Express, qui réalise sa propre validation.
 */
export function CreateArticleForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topicId, setTopicId] = useState("");

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * Charge les thèmes disponibles pour le formulaire.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadTopics() {
      try {
        const response = await fetch(`${API_URL}/api/topics`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Impossible de charger les thèmes.");
        }

        const json: unknown = await response.json();
        const parsed = topicsResponseSchema.parse(json);

        if (!controller.signal.aborted) {
          setTopics(parsed.data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setTopicsError("Impossible de récupérer les thèmes disponibles.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingTopics(false);
        }
      }
    }

    void loadTopics();

    return () => controller.abort();
  }, []);

  /**
   * Publie un nouvel article.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setFormError(null);

    const parsed = createArticleSchema.safeParse({
      title,
      content,
      topicId,
    });

    if (!parsed.success) {
      setFormError("Vérifiez le titre, le contenu et le thème sélectionné.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await postWithCsrf("/api/articles", parsed.data);

      if (response.status === 401) {
        throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
      }

      if (response.status === 403) {
        throw new Error("La vérification de sécurité a échoué.");
      }

      if (response.status === 404) {
        throw new Error("Le thème sélectionné n'existe plus.");
      }

      if (!response.ok) {
        throw new Error("Impossible de publier l'article. Réessayez.");
      }

      router.push("/articles");
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      {/* En-tête : retour + titre centré */}
      <div className="relative mb-10 flex items-center justify-center">
        <Link
          href="/articles"
          aria-label="Retour aux articles"
          className="absolute left-0 flex items-center justify-center text-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-7" aria-hidden="true" />
        </Link>

        <h1 className="px-10 text-center text-xl font-semibold">
          Créer un nouvel article
        </h1>
      </div>

      {/* Formulaire centré */}
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mx-auto flex w-full max-w-md flex-col gap-3"
      >
        {formError && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          >
            {formError}
          </p>
        )}

        {/* Sélection du thème */}
        <div>
          <label htmlFor="article-topic" className="sr-only">
            Thème de l&apos;article
          </label>

          <select
            id="article-topic"
            required
            value={topicId}
            onChange={(event) => setTopicId(event.target.value)}
            disabled={
              submitting ||
              loadingTopics ||
              topicsError !== null ||
              topics.length === 0
            }
            className="h-12 w-full rounded-md border border-primary bg-background px-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {loadingTopics
                ? "Chargement des thèmes..."
                : "Sélectionner un thème"}
            </option>

            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>

          {topicsError && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {topicsError}
            </p>
          )}

          {!loadingTopics && !topicsError && topics.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Aucun thème disponible.
            </p>
          )}
        </div>

        {/* Titre de l'article */}
        <div>
          <label htmlFor="article-title" className="sr-only">
            Titre de l&apos;article
          </label>

          <input
            id="article-title"
            type="text"
            required
            minLength={5}
            maxLength={255}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Titre de l'article"
            disabled={submitting}
            className="h-12 w-full rounded-md border border-primary bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
          />
        </div>

        {/* Contenu de l'article */}
        <div>
          <label htmlFor="article-content" className="sr-only">
            Contenu de l&apos;article
          </label>

          <textarea
            id="article-content"
            required
            minLength={20}
            maxLength={10000}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Contenu de l'article"
            disabled={submitting}
            className="min-h-56 w-full resize-y rounded-md border border-primary bg-background p-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
          />
        </div>

        {/* Bouton de création */}
        <div className="mt-5 flex justify-center">
          <button
            type="submit"
            disabled={
              submitting ||
              loadingTopics ||
              topicsError !== null ||
              topics.length === 0
            }
            className="min-w-36 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Création..." : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}
