import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  router: {
    replace: vi.fn(),
    refresh: vi.fn(),
  },
  patchWithCsrf: vi.fn(),
  deleteWithCsrf: vi.fn(),
}));

// Le routeur doit conserver la même référence entre
// les rendus pour ne pas relancer useEffect en boucle.
vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));

vi.mock("@/lib/api-client", () => ({
  patchWithCsrf: mocks.patchWithCsrf,
  deleteWithCsrf: mocks.deleteWithCsrf,
}));

import { ProfilePage } from "../features/profile/components/profile-page";

const userId = "123e4567-e89b-42d3-a456-426614174000";
const topicId = "223e4567-e89b-42d3-a456-426614174000";

const currentUser = {
  id: userId,
  username: "alice",
  email: "alice@example.test",
};

const subscription = {
  topicId,
  createdAt: "2026-11-12T12:00:00.000Z",
  topic: {
    name: "JavaScript",
    description: "Langage de programmation web.",
  },
};

type MockOptions = {
  subscriptions?: boolean;
  userStatus?: number;
  subscriptionsStatus?: number;
};

/**
 * Simule les lectures des informations du profil.
 * Les données ne proviennent pas de PostgreSQL.
 */
function mockProfileApi(options: MockOptions = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("/api/auth/me")) {
        if (options.userStatus) {
          return {
            ok: false,
            status: options.userStatus,
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: currentUser,
          }),
        };
      }

      if (url.endsWith("/api/subscriptions")) {
        if (options.subscriptionsStatus) {
          return {
            ok: false,
            status: options.subscriptionsStatus,
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: options.subscriptions === false ? [] : [subscription],
          }),
        };
      }

      throw new Error(`Requête inattendue : ${url}`);
    }),
  );
}

/**
 * Attend la fin du chargement initial.
 */
async function waitForProfile() {
  return screen.findByRole("heading", {
    name: "Profil utilisateur",
  });
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockProfileApi();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("affiche le pseudo, l'email et les abonnements", async () => {
    render(<ProfilePage />);

    await waitForProfile();

    expect(
      screen.getByRole("textbox", {
        name: "Nom d'utilisateur",
      }),
    ).toHaveValue("alice");

    expect(
      screen.getByRole("textbox", {
        name: "Adresse email",
      }),
    ).toHaveValue("alice@example.test");

    expect(screen.getByText("JavaScript")).toBeInTheDocument();

    expect(
      screen.getByText("Langage de programmation web."),
    ).toBeInTheDocument();
  });

  it("affiche un message si l'utilisateur n'a aucun abonnement", async () => {
    mockProfileApi({ subscriptions: false });

    render(<ProfilePage />);

    expect(
      await screen.findByText("Vous ne suivez aucun thème pour le moment."),
    ).toBeInTheDocument();
  });

  it("permet de se désabonner depuis le profil", async () => {
    const user = userEvent.setup();

    mocks.deleteWithCsrf.mockResolvedValue({
      ok: true,
      status: 204,
    });

    render(<ProfilePage />);
    await waitForProfile();

    await user.click(
      screen.getByRole("button", {
        name: "Se désabonner",
      }),
    );

    await waitFor(() => {
      expect(mocks.deleteWithCsrf).toHaveBeenCalledWith(
        `/api/subscriptions/${topicId}`,
      );
    });

    expect(
      await screen.findByText("Vous ne suivez aucun thème pour le moment."),
    ).toBeInTheDocument();

    expect(screen.queryByText("JavaScript")).not.toBeInTheDocument();
  });

  it("met à jour le pseudo après vérification du mot de passe", async () => {
    const user = userEvent.setup();

    mocks.patchWithCsrf.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          ...currentUser,
          username: "alice_dev",
        },
      }),
    });

    render(<ProfilePage />);
    await waitForProfile();

    const usernameInput = screen.getByRole("textbox", {
      name: "Nom d'utilisateur",
    });

    await user.clear(usernameInput);
    await user.type(usernameInput, "alice_dev");

    await user.type(
      screen.getByLabelText("Mot de passe actuel"),
      "MotDePasseActuel123!",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Sauvegarder",
      }),
    );

    await waitFor(() => {
      expect(mocks.patchWithCsrf).toHaveBeenCalledWith("/api/auth/me", {
        username: "alice_dev",
        email: "alice@example.test",
        currentPassword: "MotDePasseActuel123!",
      });
    });

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Profil enregistré avec succès.",
    );

    expect(usernameInput).toHaveValue("alice_dev");
    expect(mocks.router.refresh).toHaveBeenCalled();
  });

  it("refuse un pseudo invalide avant l'appel API", async () => {
    const user = userEvent.setup();

    render(<ProfilePage />);
    await waitForProfile();

    const usernameInput = screen.getByRole("textbox", {
      name: "Nom d'utilisateur",
    });

    await user.clear(usernameInput);
    await user.type(usernameInput, "alice!");

    await user.type(
      screen.getByLabelText("Mot de passe actuel"),
      "MotDePasseActuel123!",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Sauvegarder",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Vérifiez vos informations et votre mot de passe.",
    );

    expect(mocks.patchWithCsrf).not.toHaveBeenCalled();
  });

  it("permet de demander un nouveau mot de passe", async () => {
    const user = userEvent.setup();

    mocks.patchWithCsrf.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: currentUser,
      }),
    });

    render(<ProfilePage />);
    await waitForProfile();

    await user.click(
      screen.getByRole("button", {
        name: "Changer mon mot de passe",
      }),
    );

    await user.type(
      screen.getByLabelText("Mot de passe actuel"),
      "MotDePasseActuel123!",
    );

    await user.type(
      screen.getByLabelText("Nouveau mot de passe"),
      "NouveauMotDePasse123!",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Sauvegarder",
      }),
    );

    await waitFor(() => {
      expect(mocks.patchWithCsrf).toHaveBeenCalledWith("/api/auth/me", {
        username: "alice",
        email: "alice@example.test",
        currentPassword: "MotDePasseActuel123!",
        newPassword: "NouveauMotDePasse123!",
      });
    });
  });

  it("affiche une erreur si le mot de passe actuel est incorrect", async () => {
    const user = userEvent.setup();

    mocks.patchWithCsrf.mockResolvedValue({
      ok: false,
      status: 401,
    });

    render(<ProfilePage />);
    await waitForProfile();

    await user.type(
      screen.getByLabelText("Mot de passe actuel"),
      "MauvaisMotDePasse123!",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Sauvegarder",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Mot de passe actuel incorrect ou session expirée.",
    );
  });

  it("redirige vers la connexion lorsque la session expire", async () => {
    mockProfileApi({ userStatus: 401 });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(mocks.router.replace).toHaveBeenCalledWith("/login");
    });

    expect(mocks.patchWithCsrf).not.toHaveBeenCalled();
  });
});
