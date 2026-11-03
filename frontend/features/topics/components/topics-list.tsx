"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

const topicSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
});

const responseSchema = z.object({
  data: z.array(topicSchema),
});

type Topic = z.infer<typeof topicSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function TopicsList() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTopics() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/topics`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json: unknown = await response.json();
        const result = responseSchema.parse(json);

        if (!controller.signal.aborted) {
          setTopics(result.data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Impossible de charger les thèmes.");
          setTopics([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadTopics();

    return () => controller.abort();
  }, [retry]);

  if (loading) {
    return <p role="status">Chargement des thèmes...</p>;
  }

  if (error) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-destructive">{error}</p>

        <button
          type="button"
          onClick={() => setRetry((value) => value + 1)}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (topics.length === 0) {
    return <p>Aucun thème disponible.</p>;
  }

  return (
    <section aria-label="Liste des thèmes">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {topics.map((topic) => (
          <article
            key={topic.id}
            className="flex min-h-44 flex-col rounded-lg bg-muted p-4"
          >
            <h2 className="font-semibold">{topic.name}</h2>

            <p className="mt-2 flex-1 text-sm">
              {topic.description ?? "Aucune description disponible."}
            </p>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                disabled
                title="Disponible après l'implémentation des abonnements"
                className="min-w-32 cursor-not-allowed rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-70"
              >
                S&apos;abonner
              </button>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Les abonnements seront disponibles après la mise en place de
        l&apos;authentification.
      </p>
    </section>
  );
}
