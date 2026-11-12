import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  postWithCsrf: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  postWithCsrf: mocks.postWithCsrf,
}));

import { RegisterForm } from "../features/auth/components/register-form";

async function fillValidForm() {
  const user = userEvent.setup();

  await user.type(
    screen.getByRole("textbox", { name: "Nom d'utilisateur" }),
    "alice_dev",
  );

  await user.type(
    screen.getByRole("textbox", { name: "Adresse e-mail" }),
    "alice@example.test",
  );

  await user.type(screen.getByLabelText("Mot de passe"), "PasswordDeTest123!");

  return user;
}

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("affiche les champs du formulaire d'inscription", () => {
    render(<RegisterForm />);

    expect(
      screen.getByRole("textbox", { name: "Nom d'utilisateur" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", { name: "Adresse e-mail" }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "S'inscrire" })).toBeEnabled();
  });

  it("refuse un pseudo trop court sans appeler l'API", async () => {
    render(<RegisterForm />);

    const user = await fillValidForm();

    const usernameInput = screen.getByRole("textbox", {
      name: "Nom d'utilisateur",
    });

    await user.clear(usernameInput);
    await user.type(usernameInput, "ab");

    await user.click(screen.getByRole("button", { name: "S'inscrire" }));

    expect(
      screen.getByText("Le pseudo doit contenir au moins 3 caractères."),
    ).toBeInTheDocument();

    expect(mocks.postWithCsrf).not.toHaveBeenCalled();
  });

  it("refuse une adresse email invalide", async () => {
    render(<RegisterForm />);

    const user = await fillValidForm();

    const emailInput = screen.getByRole("textbox", {
      name: "Adresse e-mail",
    });

    await user.clear(emailInput);
    await user.type(emailInput, "adresse-invalide");

    await user.click(screen.getByRole("button", { name: "S'inscrire" }));

    expect(screen.getByText("Adresse e-mail invalide.")).toBeInTheDocument();

    expect(mocks.postWithCsrf).not.toHaveBeenCalled();
  });

  it("refuse un mot de passe trop court", async () => {
    render(<RegisterForm />);

    const user = await fillValidForm();

    const passwordInput = screen.getByLabelText("Mot de passe");

    await user.clear(passwordInput);
    await user.type(passwordInput, "123456");

    await user.click(screen.getByRole("button", { name: "S'inscrire" }));

    expect(
      screen.getByText("Le mot de passe doit contenir au moins 12 caractères."),
    ).toBeInTheDocument();

    expect(mocks.postWithCsrf).not.toHaveBeenCalled();
  });

  it("normalise les données puis confirme une inscription réussie", async () => {
    mocks.postWithCsrf.mockResolvedValue({
      status: 201,
      ok: true,
    });

    render(<RegisterForm />);

    const user = userEvent.setup();

    await user.type(
      screen.getByRole("textbox", { name: "Nom d'utilisateur" }),
      "Alice_Dev",
    );

    await user.type(
      screen.getByRole("textbox", { name: "Adresse e-mail" }),
      "ALICE@EXAMPLE.TEST",
    );

    await user.type(
      screen.getByLabelText("Mot de passe"),
      "PasswordDeTest123!",
    );

    await user.click(screen.getByRole("button", { name: "S'inscrire" }));

    await waitFor(() => {
      expect(mocks.postWithCsrf).toHaveBeenCalledWith("/api/auth/register", {
        username: "alice_dev",
        email: "alice@example.test",
        password: "PasswordDeTest123!",
      });
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Compte créé avec succès",
    );

    expect(
      screen.getByRole("textbox", { name: "Nom d'utilisateur" }),
    ).toHaveValue("");

    expect(screen.getByRole("textbox", { name: "Adresse e-mail" })).toHaveValue(
      "",
    );

    expect(screen.getByLabelText("Mot de passe")).toHaveValue("");
  });

  it("affiche une erreur lorsque le compte existe déjà", async () => {
    mocks.postWithCsrf.mockResolvedValue({
      status: 409,
      ok: false,
    });

    render(<RegisterForm />);

    const user = await fillValidForm();

    await user.click(screen.getByRole("button", { name: "S'inscrire" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cette adresse e-mail ou ce pseudo est déjà utilisé.",
    );
  });

  it("affiche une erreur si l'API rejette les données", async () => {
    mocks.postWithCsrf.mockResolvedValue({
      status: 400,
      ok: false,
    });

    render(<RegisterForm />);

    const user = await fillValidForm();

    await user.click(screen.getByRole("button", { name: "S'inscrire" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Les informations fournies sont invalides.",
    );
  });

  it("gère une erreur réseau sans confirmer l'inscription", async () => {
    mocks.postWithCsrf.mockRejectedValue(new Error("Network error"));

    render(<RegisterForm />);

    const user = await fillValidForm();

    await user.click(screen.getByRole("button", { name: "S'inscrire" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de créer le compte. Veuillez réessayer.",
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
