"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";

import { postWithCsrf, deleteWithCsrf } from "@/lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const topicSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
});

const topicsResponseSchema = z.object({
  data: z.array(topicSchema),
});

const subscriptionsResponseSchema = z.object({
  data: z.array(
    z.object({
      topicId: z.uuid(),
      createdAt: z.string(),
    }),
  ),
});

type Topic = z.infer<typeof topicSchema>;

type SubscriptionStatus = "loading" | "authenticated" | "guest" | "error";

/**
 * Affiche les thèmes et les abonnements de l'utilisateur.
 *
 * Les modifications sont persistées via l'API Express.
 * L'interface est actualisée sans rechargement de page.
 */
export function TopicsList() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>("loading");

  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [updatingTopicId, setUpdatingTopicId] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  /**
   * Charge séparément les thèmes et les abonnements.
   * Un problème d'authentification n'empêche pas
   * l'affichage des thèmes publics.
   */
  useEffect(() => {
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    setActionError(null);
    setSubscriptionStatus("loading");
    setSubscribedIds(new Set());

    async function loadTopics() {
      try {
        const response = await fetch(`${API_URL}/api/topics`, {
          signal: controller.signal,
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json: unknown = await response.json();
        const parsed = topicsResponseSchema.parse(json);

        if (!controller.signal.aborted) {
          setTopics(parsed.data);
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

    async function loadSubscriptions() {
      try {
        const response = await fetch(`${API_URL}/api/subscriptions`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (response.status === 401) {
          setSubscriptionStatus("guest");
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json: unknown = await response.json();
        const parsed = subscriptionsResponseSchema.parse(json);

        if (!controller.signal.aborted) {
          setSubscribedIds(
            new Set(parsed.data.map((subscription) => subscription.topicId)),
          );

          setSubscriptionStatus("authenticated");
        }
      } catch {
        if (!controller.signal.aborted) {
          setSubscriptionStatus("error");
        }
      }
    }

    void loadTopics();
    void loadSubscriptions();

    return () => controller.abort();
  }, [retry]);

  /**
   * Abonne ou désabonne l'utilisateur du thème demandé.
   *
   * L'état local ne change qu'après confirmation
   * de l'opération par l'API.
   */
  async function toggleSubscription(topicId: string) {
    if (subscriptionStatus !== "authenticated" || updatingTopicId !== null) {
      return;
    }

    setUpdatingTopicId(topicId);
    setActionError(null);

    const isSubscribed = subscribedIds.has(topicId);

    try {
      const response = isSubscribed
        ? await deleteWithCsrf(`/api/subscriptions/${topicId}`)
        : await postWithCsrf("/api/subscriptions", { topicId });

      if (response.status === 401) {
        setSubscriptionStatus("guest");
        setSubscribedIds(new Set());
        setActionError("Votre session a expiré. Reconnectez-vous.");
        return;
      }

      // L'API confirme que l'abonnement existe déjà.
      if (!isSubscribed && response.status === 409) {
        setSubscribedIds((previous) => {
          const next = new Set(previous);
          next.add(topicId);
          return next;
        });
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setSubscribedIds((previous) => {
        const next = new Set(previous);

        if (isSubscribed) {
          next.delete(topicId);
        } else {
          next.add(topicId);
        }

        return next;
      });
    } catch {
      setActionError("Impossible de modifier votre abonnement. Réessayez.");
    } finally {
      setUpdatingTopicId(null);
    }
  }

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
      {subscriptionStatus === "error" && (
        <div role="alert" className="mb-4 space-y-2">
          <p className="text-sm text-destructive">
            Impossible de récupérer vos abonnements.
          </p>

          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="text-sm text-primary underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {actionError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {actionError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {topics.map((topic) => {
          const isSubscribed = subscribedIds.has(topic.id);
          const isUpdating = updatingTopicId === topic.id;

          return (
            <article
              key={topic.id}
              className="flex min-h-44 flex-col rounded-lg bg-muted p-4"
            >
              <h2 className="font-semibold">{topic.name}</h2>

              <p className="mt-2 flex-1 text-sm">
                {topic.description ?? "Aucune description disponible."}
              </p>

              <div className="mt-4 flex justify-center">
                {subscriptionStatus === "guest" ? (
                  <Link
                    href="/login"
                    className="min-w-32 rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
                  >
                    Se connecter
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={
                      subscriptionStatus !== "authenticated" ||
                      updatingTopicId !== null
                    }
                    onClick={() => void toggleSubscription(topic.id)}
                    aria-label={
                      isSubscribed
                        ? `Se désabonner de ${topic.name}`
                        : `S'abonner à ${topic.name}`
                    }
                    title={
                      isSubscribed
                        ? "Cliquer pour se désabonner"
                        : "Cliquer pour s'abonner"
                    }
                    className={
                      "min-w-32 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 " +
                      (isSubscribed
                        ? "bg-secondary text-secondary-foreground border border-border"
                        : "bg-primary text-primary-foreground hover:bg-primary/90")
                    }
                  >
                    {isUpdating
                      ? "Chargement..."
                      : isSubscribed
                        ? "Déjà abonné"
                        : "S'abonner"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
