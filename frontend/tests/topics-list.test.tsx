import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  postWithCsrf: vi.fn(),
  deleteWithCsrf: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  postWithCsrf: mocks.postWithCsrf,
  deleteWithCsrf: mocks.deleteWithCsrf,
}));

import { TopicsList } from "../features/topics/components/topics-list";

const topicId = "123e4567-e89b-42d3-a456-426614174000";

type ApiOptions = {
  subscribed?: boolean;
  guest?: boolean;
  topicsError?: boolean;
};

/**
 * Simule les endpoints utilisés par TopicsList.
 * Aucune connexion PostgreSQL n'est effectuée.
 */
function mockApi(options: ApiOptions = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("/api/topics")) {
        if (options.topicsError) {
          return { ok: false, status: 500 };
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                id: topicId,
                name: "JavaScript",
                description: "Langage de programmation web.",
              },
            ],
          }),
        };
      }

      if (url.endsWith("/api/subscriptions")) {
        if (options.guest) {
          return { ok: false, status: 401 };
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: options.subscribed
              ? [
                  {
                    topicId,
                    createdAt: "2026-11-12T12:00:00.000Z",
                  },
                ]
              : [],
          }),
        };
      }

      throw new Error(`Requête inattendue : ${url}`);
    }),
  );
}

describe("TopicsList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockApi();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("affiche les thèmes récupérés depuis l'API", async () => {
    render(<TopicsList />);

    expect(await screen.findByText("JavaScript")).toBeInTheDocument();

    expect(
      screen.getByText("Langage de programmation web."),
    ).toBeInTheDocument();
  });

  it("affiche l'état déjà abonné de l'utilisateur", async () => {
    mockApi({ subscribed: true });

    render(<TopicsList />);

    const button = await screen.findByRole("button", {
      name: "Se désabonner de JavaScript",
    });

    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Déjà abonné");
  });

  it("permet de s'abonner à un thème", async () => {
    const user = userEvent.setup();

    mocks.postWithCsrf.mockResolvedValue({
      ok: true,
      status: 201,
    });

    render(<TopicsList />);

    const button = await screen.findByRole("button", {
      name: "S'abonner à JavaScript",
    });

    await waitFor(() => {
      expect(button).toBeEnabled();
    });

    await user.click(button);

    expect(mocks.postWithCsrf).toHaveBeenCalledWith("/api/subscriptions", {
      topicId,
    });

    expect(
      await screen.findByRole("button", {
        name: "Se désabonner de JavaScript",
      }),
    ).toHaveTextContent("Déjà abonné");
  });

  it("permet de se désabonner d'un thème", async () => {
    const user = userEvent.setup();

    mockApi({ subscribed: true });

    mocks.deleteWithCsrf.mockResolvedValue({
      ok: true,
      status: 204,
    });

    render(<TopicsList />);

    const button = await screen.findByRole("button", {
      name: "Se désabonner de JavaScript",
    });

    await waitFor(() => {
      expect(button).toBeEnabled();
    });

    await user.click(button);

    expect(mocks.deleteWithCsrf).toHaveBeenCalledWith(
      `/api/subscriptions/${topicId}`,
    );

    expect(
      await screen.findByRole("button", {
        name: "S'abonner à JavaScript",
      }),
    ).toHaveTextContent("S'abonner");
  });

  it("propose la connexion si la session est absente", async () => {
    mockApi({ guest: true });

    render(<TopicsList />);

    const link = await screen.findByRole("link", {
      name: "Se connecter",
    });

    expect(link).toHaveAttribute("href", "/login");

    expect(mocks.postWithCsrf).not.toHaveBeenCalled();
  });

  it("affiche une erreur lorsque les thèmes ne chargent pas", async () => {
    mockApi({ topicsError: true });

    render(<TopicsList />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de charger les thèmes.",
    );

    expect(
      screen.getByRole("button", {
        name: "Réessayer",
      }),
    ).toBeInTheDocument();
  });

  it("ne modifie pas l'abonnement si l'API échoue", async () => {
    const user = userEvent.setup();

    mocks.postWithCsrf.mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<TopicsList />);

    const button = await screen.findByRole("button", {
      name: "S'abonner à JavaScript",
    });

    await waitFor(() => {
      expect(button).toBeEnabled();
    });

    await user.click(button);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de modifier votre abonnement. Réessayez.",
    );

    expect(
      screen.getByRole("button", {
        name: "S'abonner à JavaScript",
      }),
    ).toHaveTextContent("S'abonner");
  });
});
