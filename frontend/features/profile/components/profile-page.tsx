"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { deleteWithCsrf, patchWithCsrf } from "@/lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const userSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.email(),
});

const userResponseSchema = z.object({
  data: userSchema,
});

const subscriptionsResponseSchema = z.object({
  data: z.array(
    z.object({
      topicId: z.uuid(),
      createdAt: z.string(),
      topic: z.object({
        name: z.string(),
        description: z.string().nullable(),
      }),
    }),
  ),
});

const updateProfileSchema = z.strictObject({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_]+$/),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(128).optional(),
});

type Subscription = z.infer<typeof subscriptionsResponseSchema>["data"][number];

/**
 * Profil utilisateur et gestion de ses abonnements.
 */
export function ProfilePage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePassword, setChangePassword] = useState(false);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [removingTopicId, setRemovingTopicId] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(
    null,
  );

  /**
   * Charge le compte et les abonnements.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const [userResponse, subscriptionsResponse] = await Promise.all([
          fetch(`${API_URL}/api/auth/me`, {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch(`${API_URL}/api/subscriptions`, {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        if (controller.signal.aborted) return;

        if (
          userResponse.status === 401 ||
          subscriptionsResponse.status === 401
        ) {
          router.replace("/login");
          return;
        }

        if (!userResponse.ok || !subscriptionsResponse.ok) {
          throw new Error("Impossible de charger le profil.");
        }

        const userJson: unknown = await userResponse.json();
        const subscriptionsJson: unknown = await subscriptionsResponse.json();

        const user = userResponseSchema.parse(userJson);
        const subscribed = subscriptionsResponseSchema.parse(subscriptionsJson);

        if (!controller.signal.aborted) {
          setUsername(user.data.username);
          setEmail(user.data.email);
          setSubscriptions(subscribed.data);
          setLoadError(null);
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoadError("Impossible de charger vos informations.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, [retry, router]);

  /**
   * Enregistre les modifications du compte.
   */
  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setSaveError(null);
    setSaveSuccess(false);

    const parsed = updateProfileSchema.safeParse({
      username,
      email,
      currentPassword,
      ...(changePassword && newPassword ? { newPassword } : {}),
    });

    if (!parsed.success) {
      setSaveError("Vérifiez vos informations et votre mot de passe.");
      return;
    }

    setSaving(true);

    try {
      const response = await patchWithCsrf("/api/auth/me", parsed.data);

      if (response.status === 401) {
        throw new Error("Mot de passe actuel incorrect ou session expirée.");
      }

      if (response.status === 409) {
        throw new Error("Ce pseudo ou cette adresse email est déjà utilisé.");
      }

      if (!response.ok) {
        throw new Error("Impossible d'enregistrer les modifications.");
      }

      const json: unknown = await response.json();
      const result = userResponseSchema.parse(json);

      setUsername(result.data.username);
      setEmail(result.data.email);
      setCurrentPassword("");
      setNewPassword("");
      setChangePassword(false);
      setSaveSuccess(true);

      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue.",
      );
    } finally {
      setSaving(false);
    }
  }

  /**
   * Supprime un abonnement et actualise la liste.
   */
  async function handleUnsubscribe(topicId: string) {
    if (removingTopicId !== null) return;

    setRemovingTopicId(topicId);
    setSubscriptionError(null);

    try {
      const response = await deleteWithCsrf(`/api/subscriptions/${topicId}`);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Désabonnement impossible.");
      }

      setSubscriptions((previous) =>
        previous.filter((subscription) => subscription.topicId !== topicId),
      );
    } catch {
      setSubscriptionError("Impossible de vous désabonner. Réessayez.");
    } finally {
      setRemovingTopicId(null);
    }
  }

  if (loading) {
    return (
      <p role="status" className="text-center text-sm">
        Chargement du profil...
      </p>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-3 text-center" role="alert">
        <p className="text-destructive">{loadError}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setRetry((value) => value + 1);
          }}
          className="rounded-md bg-primary px-5 py-2 text-sm text-primary-foreground"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Informations personnelles */}
      <section aria-labelledby="profile-heading">
        <h1
          id="profile-heading"
          className="mb-5 text-center text-xl font-semibold"
        >
          Profil utilisateur
        </h1>

        <form
          onSubmit={(event) => void handleSave(event)}
          className="mx-auto flex w-full max-w-sm flex-col gap-3"
        >
          <label htmlFor="profile-username" className="sr-only">
            Nom d&apos;utilisateur
          </label>
          <input
            id="profile-username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setSaveSuccess(false);
            }}
            required
            minLength={3}
            maxLength={50}
            autoComplete="username"
            disabled={saving}
            placeholder="Username"
            className="h-11 w-full rounded-md border border-primary bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />

          <label htmlFor="profile-email" className="sr-only">
            Adresse email
          </label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setSaveSuccess(false);
            }}
            required
            autoComplete="email"
            disabled={saving}
            placeholder="email@email.fr"
            className="h-11 w-full rounded-md border border-primary bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />

          <label htmlFor="profile-password" className="sr-only">
            Mot de passe actuel
          </label>
          <input
            id="profile-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            autoComplete="current-password"
            disabled={saving}
            placeholder="Mot de passe actuel"
            className="h-11 w-full rounded-md border border-primary bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />

          <button
            type="button"
            onClick={() => {
              setChangePassword((value) => !value);
              setNewPassword("");
            }}
            className="self-start text-xs text-primary hover:underline"
          >
            {changePassword
              ? "Annuler le changement de mot de passe"
              : "Changer mon mot de passe"}
          </button>

          {changePassword && (
            <>
              <label htmlFor="profile-new-password" className="sr-only">
                Nouveau mot de passe
              </label>
              <input
                id="profile-new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={12}
                maxLength={128}
                required
                autoComplete="new-password"
                disabled={saving}
                placeholder="Nouveau mot de passe (12 caractères min.)"
                className="h-11 w-full rounded-md border border-primary bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </>
          )}

          {saveError && (
            <p role="alert" className="text-sm text-destructive">
              {saveError}
            </p>
          )}

          {saveSuccess && (
            <p role="status" className="text-sm text-center text-green-700">
              Profil enregistré avec succès.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 self-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Sauvegarder"}
          </button>
        </form>
      </section>

      {/* Séparation de la maquette */}
      <div className="my-8 border-t border-border" />

      {/* Thèmes suivis */}
      <section aria-labelledby="subscriptions-heading">
        <h2
          id="subscriptions-heading"
          className="mb-5 text-center text-xl font-semibold"
        >
          Abonnements
        </h2>

        {subscriptionError && (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {subscriptionError}
          </p>
        )}

        {subscriptions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Vous ne suivez aucun thème pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {subscriptions.map((subscription) => (
              <article
                key={subscription.topicId}
                className="flex min-h-44 flex-col rounded-lg bg-muted p-4"
              >
                <h3 className="font-semibold">{subscription.topic.name}</h3>

                <p className="mt-2 flex-1 text-sm leading-relaxed">
                  {subscription.topic.description ??
                    "Aucune description disponible."}
                </p>

                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    disabled={removingTopicId !== null}
                    onClick={() => void handleUnsubscribe(subscription.topicId)}
                    className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {removingTopicId === subscription.topicId
                      ? "Suppression..."
                      : "Se désabonner"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
