import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  postWithCsrf: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  postWithCsrf: mocks.postWithCsrf,
}));

import { ArticleDetails } from "../features/articles/components/article-details";

const articleId = "123e4567-e89b-42d3-a456-426614174000";

const article = {
  id: articleId,
  title: "Comprendre TypeScript",
  content: "TypeScript apporte des outils pour sécuriser le code JavaScript.",
  createdAt: "2026-11-12T10:00:00.000Z",
  updatedAt: "2026-11-12T10:00:00.000Z",
  author: {
    username: "alice",
  },
  topic: {
    name: "TypeScript",
  },
  comments: [
    {
      id: "223e4567-e89b-42d3-a456-426614174000",
      content: "Un commentaire existant",
      createdAt: "2026-11-12T11:00:00.000Z",
      author: {
        username: "bob",
      },
    },
  ],
};

function mockArticleResponse(data = article) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ data }),
  };
}

describe("ArticleDetails", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockArticleResponse()));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("affiche l'article et les commentaires chargés depuis l'API", async () => {
    render(<ArticleDetails articleId={articleId} />);

    expect(
      await screen.findByRole("heading", {
        name: "Comprendre TypeScript",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText(article.content)).toBeInTheDocument();

    expect(screen.getByText("Un commentaire existant")).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:4000/api/articles/${articleId}`,
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("affiche une erreur lorsque l'article est introuvable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    render(<ArticleDetails articleId={articleId} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cet article n'existe pas.",
    );

    expect(
      screen.getByRole("link", { name: "Retour aux articles" }),
    ).toHaveAttribute("href", "/articles");
  });

  it("affiche une erreur si la session est expirée", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }),
    );

    render(<ArticleDetails articleId={articleId} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Votre session a expiré. Veuillez vous reconnecter.",
    );
  });

  it("publie un commentaire puis recharge les données", async () => {
    const user = userEvent.setup();

    const newComment = {
      id: "323e4567-e89b-42d3-a456-426614174000",
      content: "Très bon article !",
      createdAt: "2026-11-12T12:00:00.000Z",
      author: {
        username: "alice",
      },
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockArticleResponse())
      .mockResolvedValue(
        mockArticleResponse({
          ...article,
          comments: [...article.comments, newComment],
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    mocks.postWithCsrf.mockResolvedValue({
      ok: true,
      status: 201,
    });

    render(<ArticleDetails articleId={articleId} />);

    await screen.findByRole("heading", {
      name: "Comprendre TypeScript",
    });

    const commentInput = screen.getByRole("textbox", {
      name: "Votre commentaire",
    });

    await user.type(commentInput, "Très bon article !");

    await user.click(
      screen.getByRole("button", {
        name: "Envoyer le commentaire",
      }),
    );

    await waitFor(() => {
      expect(mocks.postWithCsrf).toHaveBeenCalledWith(
        `/api/articles/${articleId}/comments`,
        { content: "Très bon article !" },
      );
    });

    expect(await screen.findByText("Très bon article !")).toBeInTheDocument();

    expect(commentInput).toHaveValue("");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("affiche une erreur lorsque la protection CSRF refuse le commentaire", async () => {
    const user = userEvent.setup();

    mocks.postWithCsrf.mockResolvedValue({
      ok: false,
      status: 403,
    });

    render(<ArticleDetails articleId={articleId} />);

    await screen.findByRole("heading", {
      name: "Comprendre TypeScript",
    });

    await user.type(
      screen.getByRole("textbox", {
        name: "Votre commentaire",
      }),
      "Mon commentaire",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Envoyer le commentaire",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La vérification de sécurité a échoué.",
    );
  });
});
