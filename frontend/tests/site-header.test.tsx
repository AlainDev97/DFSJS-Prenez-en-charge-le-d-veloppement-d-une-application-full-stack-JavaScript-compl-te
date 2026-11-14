import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  postWithCsrf: vi.fn(),
  pathname: "/topics",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
  usePathname: () => mocks.pathname,
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("@/lib/api-client", () => ({
  postWithCsrf: mocks.postWithCsrf,
}));

import { SiteHeader } from "../components/layout/site-header";

const currentUser = {
  data: {
    id: "123e4567-e89b-42d3-a456-426614174000",
    username: "alice",
    email: "alice@example.test",
  },
};

function mockSession(status = 200, body: unknown = currentUser) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }),
  );
}

describe("SiteHeader", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.pathname = "/topics";
    mockSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.style.overflow = "";
  });

  it("affiche la connexion lorsqu'aucune session n'existe", async () => {
    mockSession(401);

    render(<SiteHeader />);

    const navigation = screen.getByRole("navigation", {
      name: "Navigation principale",
    });

    expect(
      await within(navigation).findByRole("link", {
        name: "Se connecter",
      }),
    ).toHaveAttribute("href", "/login");

    expect(
      within(navigation).queryByRole("button", {
        name: "Se déconnecter",
      }),
    ).not.toBeInTheDocument();
  });

  it("affiche la navigation et le profil d'un utilisateur connecté", async () => {
    render(<SiteHeader />);

    expect(
      await screen.findByRole("link", {
        name: "Accéder au profil de alice",
      }),
    ).toHaveAttribute("href", "/profile");

    const navigation = screen.getByRole("navigation", {
      name: "Navigation principale",
    });

    expect(
      within(navigation).getByRole("link", {
        name: "Thèmes",
      }),
    ).toHaveAttribute("aria-current", "page");

    expect(
      within(navigation).getByRole("button", {
        name: "Se déconnecter",
      }),
    ).toBeEnabled();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/auth/me",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("déconnecte l'utilisateur et redirige vers la connexion", async () => {
    const user = userEvent.setup();

    mocks.postWithCsrf.mockResolvedValue({
      ok: true,
      status: 204,
    });

    render(<SiteHeader />);

    const navigation = screen.getByRole("navigation", {
      name: "Navigation principale",
    });

    await user.click(
      await within(navigation).findByRole("button", {
        name: "Se déconnecter",
      }),
    );

    await waitFor(() => {
      expect(mocks.postWithCsrf).toHaveBeenCalledWith("/api/auth/logout");

      expect(mocks.replace).toHaveBeenCalledWith("/login");
      expect(mocks.refresh).toHaveBeenCalled();
    });

    expect(
      await within(navigation).findByRole("link", {
        name: "Se connecter",
      }),
    ).toBeInTheDocument();
  });

  it("affiche une erreur si la déconnexion échoue", async () => {
    const user = userEvent.setup();

    mocks.postWithCsrf.mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<SiteHeader />);

    const navigation = screen.getByRole("navigation", {
      name: "Navigation principale",
    });

    await user.click(
      await within(navigation).findByRole("button", {
        name: "Se déconnecter",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de se déconnecter. Réessayez.",
    );

    expect(mocks.replace).not.toHaveBeenCalled();

    expect(
      within(navigation).getByRole("button", {
        name: "Se déconnecter",
      }),
    ).toBeEnabled();
  });

  it("ouvre et ferme le menu mobile avec la touche Échap", async () => {
    const user = userEvent.setup();

    render(<SiteHeader />);

    await screen.findByRole("link", {
      name: "Accéder au profil de alice",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Ouvrir le menu",
      }),
    );

    expect(
      screen.getByRole("navigation", {
        name: "Navigation principale mobile",
      }),
    ).toBeInTheDocument();

    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("navigation", {
        name: "Navigation principale mobile",
      }),
    ).not.toBeInTheDocument();

    expect(document.body.style.overflow).toBe("");
  });

  it("ferme le menu mobile après un clic sur un lien", async () => {
    const user = userEvent.setup();

    render(<SiteHeader />);

    await screen.findByRole("link", {
      name: "Accéder au profil de alice",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Ouvrir le menu",
      }),
    );

    const mobileNavigation = screen.getByRole("navigation", {
      name: "Navigation principale mobile",
    });

    await user.click(
      within(mobileNavigation).getByRole("link", {
        name: "Articles",
      }),
    );

    expect(
      screen.queryByRole("navigation", {
        name: "Navigation principale mobile",
      }),
    ).not.toBeInTheDocument();
  });

  it("signale une réponse utilisateur invalide", async () => {
    mockSession(200, {
      data: {
        id: "identifiant-invalide",
        username: "alice",
        email: "email-invalide",
      },
    });

    render(<SiteHeader />);

    const navigation = screen.getByRole("navigation", {
      name: "Navigation principale",
    });

    expect(
      await within(navigation).findByText("Session indisponible"),
    ).toBeInTheDocument();

    expect(
      within(navigation).queryByRole("button", {
        name: "Se déconnecter",
      }),
    ).not.toBeInTheDocument();
  });
});
