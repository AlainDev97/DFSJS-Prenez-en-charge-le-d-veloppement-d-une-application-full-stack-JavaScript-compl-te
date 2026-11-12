import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  postWithCsrf: vi.fn(),
}));

// Simule la navigation Next.js.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replace,
  }),
}));

// Simule la communication avec l'API Express.
vi.mock("@/lib/api-client", () => ({
  postWithCsrf: mocks.postWithCsrf,
}));

import { LoginForm } from "../features/auth/components/login-form";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("affiche les champs et le bouton de connexion", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("textbox", { name: /adresse e-mail/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /se connecter/i }),
    ).toBeInTheDocument();
  });

  it("refuse les champs invalides sans appeler l'API", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: /adresse e-mail/i }),
      "email-invalide",
    );

    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(
      await screen.findByText("Adresse e-mail invalide."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Le mot de passe est obligatoire."),
    ).toBeInTheDocument();

    expect(mocks.postWithCsrf).not.toHaveBeenCalled();
  });

  it("affiche une erreur lorsque les identifiants sont incorrects", async () => {
    const user = userEvent.setup();

    mocks.postWithCsrf.mockResolvedValue({
      ok: false,
      status: 401,
    });

    render(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: /adresse e-mail/i }),
      "alice@example.com",
    );

    await user.type(
      screen.getByLabelText(/mot de passe/i),
      "MauvaisMotDePasse",
    );

    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email ou mot de passe incorrect.",
    );

    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("redirige vers les thèmes après une connexion réussie", async () => {
    const user = userEvent.setup();

    mocks.postWithCsrf.mockResolvedValue({
      ok: true,
      status: 200,
    });

    render(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: /adresse e-mail/i }),
      "ALICE@EXAMPLE.COM",
    );

    await user.type(
      screen.getByLabelText(/mot de passe/i),
      "MotDePasseValide123!",
    );

    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(mocks.postWithCsrf).toHaveBeenCalledWith("/api/auth/login", {
        email: "alice@example.com",
        password: "MotDePasseValide123!",
      });

      expect(mocks.replace).toHaveBeenCalledWith("/topics");
    });
  });

  it("affiche une erreur si la requête réseau échoue", async () => {
    const user = userEvent.setup();

    mocks.postWithCsrf.mockRejectedValue(new Error("Network error"));

    render(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: /adresse e-mail/i }),
      "alice@example.com",
    );

    await user.type(
      screen.getByLabelText(/mot de passe/i),
      "MotDePasseValide123!",
    );

    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de se connecter. Veuillez réessayer.",
    );
  });
});
