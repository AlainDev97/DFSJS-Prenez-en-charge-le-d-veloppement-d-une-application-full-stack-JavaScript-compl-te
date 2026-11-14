import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ArticlesList } from "../features/articles/components/articles-list";

const article = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  title: "Découvrir TypeScript",
  excerpt: "Un article pour apprendre TypeScript.",
  createdAt: "2026-11-12T10:00:00.000Z",
  author: {
    username: "alice",
  },
  topic: {
    name: "TypeScript",
  },
};

function successResponse(data = [article]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ data }),
  };
}

describe("ArticlesList", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(successResponse()));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("affiche les articles et permet de changer le tri", async () => {
    const user = userEvent.setup();

    render(<ArticlesList />);

    expect(
      await screen.findByRole("heading", {
        name: "Découvrir TypeScript",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(article.excerpt)).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: /Découvrir TypeScript/,
      }),
    ).toHaveAttribute("href", `/articles/${article.id}`);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/articles?sort=newest",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: /Tri décroissant/,
      }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/articles?sort=oldest",
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    expect(
      screen.getByRole("button", {
        name: /Tri croissant/,
      }),
    ).toBeInTheDocument();
  });

  it("affiche un message lorsqu'aucun article n'existe", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(successResponse([])));

    render(<ArticlesList />);

    expect(
      await screen.findByText("Aucun article disponible pour le moment."),
    ).toBeInTheDocument();
  });

  it("signale une session expirée", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }),
    );

    render(<ArticlesList />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Votre session a expiré. Veuillez vous reconnecter.",
    );
  });

  it("permet de réessayer après une erreur serveur", async () => {
    const user = userEvent.setup();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      })
      .mockResolvedValue(successResponse());

    vi.stubGlobal("fetch", fetchMock);

    render(<ArticlesList />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de charger les articles.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Réessayer",
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Découvrir TypeScript",
      }),
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
