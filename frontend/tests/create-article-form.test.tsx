import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  postWithCsrf: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/lib/api-client", () => ({
  postWithCsrf: mocks.postWithCsrf,
}));

import { CreateArticleForm } from "../features/articles/components/create-article-form";

const topicId = "123e4567-e89b-42d3-a456-426614174000";

const articleInput = {
  title: "Pourquoi utiliser TypeScript ?",
  content:
    "TypeScript apporte un typage statique utile aux projets JavaScript.",
  topicId,
};

/**
 * Remplit un formulaire de création valide.
 */
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("option", {
    name: "JavaScript",
  });

  await user.selectOptions(
    screen.getByRole("combobox", {
      name: /thème de l'article/i,
    }),
    articleInput.topicId,
  );

  await user.type(
    screen.getByRole("textbox", {
      name: /titre de l'article/i,
    }),
    articleInput.title,
  );

  await user.type(
    screen.getByRole("textbox", {
      name: /contenu de l'article/i,
    }),
    articleInput.content,
  );
}

describe("CreateArticleForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Simule GET /api/topics sans connexion réelle.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: topicId,
              name: "JavaScript",
            },
          ],
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("affiche les champs du formulaire", async () => {
    render(<CreateArticleForm />);

    expect(
      screen.getByRole("heading", {
        name: "Créer un nouvel article",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: /titre de l'article/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: /contenu de l'article/i,
      }),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("option", {
        name: "JavaScript",
      }),
    ).toBeInTheDocument();
  });

  it("charge les thèmes depuis l'API", async () => {
    render(<CreateArticleForm />);

    expect(
      await screen.findByRole("option", {
        name: "JavaScript",
      }),
    ).toHaveValue(topicId);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/topics",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("refuse des données invalides avant l'appel API", async () => {
    const user = userEvent.setup();

    render(<CreateArticleForm />);

    await screen.findByRole("option", {
      name: "JavaScript",
    });

    await user.type(
      screen.getByRole("textbox", {
        name: /titre de l'article/i,
      }),
      "Test",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: /contenu de l'article/i,
      }),
      "Court",
    );

    // Déclenche directement le submit pour tester
    // Zod indépendamment de la validation HTML native.
    const button = screen.getByRole("button", {
      name: "Créer",
    });

    const form = button.closest("form");

    expect(form).not.toBeNull();

    fireEvent.submit(form!);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Vérifiez le titre, le contenu et le thème sélectionné.",
    );

    expect(mocks.postWithCsrf).not.toHaveBeenCalled();
  });

  it("publie un article valide puis redirige", async () => {
    const user = userEvent.setup();

    mocks.postWithCsrf.mockResolvedValue({
      ok: true,
      status: 201,
    });

    render(<CreateArticleForm />);

    await fillValidForm(user);

    await user.click(
      screen.getByRole("button", {
        name: "Créer",
      }),
    );

    await waitFor(() => {
      expect(mocks.postWithCsrf).toHaveBeenCalledWith(
        "/api/articles",
        articleInput,
      );

      expect(mocks.push).toHaveBeenCalledWith("/articles");

      expect(mocks.refresh).toHaveBeenCalled();
    });
  });

  it("affiche une erreur lorsque le CSRF est refusé", async () => {
    const user = userEvent.setup();

    mocks.postWithCsrf.mockResolvedValue({
      ok: false,
      status: 403,
    });

    render(<CreateArticleForm />);

    await fillValidForm(user);

    await user.click(
      screen.getByRole("button", {
        name: "Créer",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La vérification de sécurité a échoué.",
    );

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("gère une erreur de chargement des thèmes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    render(<CreateArticleForm />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de récupérer les thèmes disponibles.",
    );

    expect(
      screen.getByRole("button", {
        name: "Créer",
      }),
    ).toBeDisabled();

    expect(mocks.postWithCsrf).not.toHaveBeenCalled();
  });
});
