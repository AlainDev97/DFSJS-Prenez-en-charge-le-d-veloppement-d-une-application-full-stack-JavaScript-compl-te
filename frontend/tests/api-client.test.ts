import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { postWithCsrf, patchWithCsrf, deleteWithCsrf } from "../lib/api-client";

const API_URL = "http://localhost:4000";
const csrfToken = "a".repeat(64);

function mockCsrfSuccess() {
  return {
    ok: true,
    status: 200,
    json: async () => ({ csrfToken }),
  };
}

describe("API Client - Protection CSRF", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ajoute le jeton CSRF aux requêtes POST", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockCsrfSuccess())
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
      });

    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      title: "Mon article",
    };

    const response = await postWithCsrf("/api/articles", payload);

    expect(response.status).toBe(201);

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${API_URL}/api/auth/csrf`, {
      credentials: "include",
      cache: "no-store",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, `${API_URL}/api/articles`, {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRF-Token": csrfToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  });

  it("gère les requêtes PATCH", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockCsrfSuccess())
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

    vi.stubGlobal("fetch", fetchMock);

    await patchWithCsrf("/api/auth/me", {
      username: "alice",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${API_URL}/api/auth/me`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          username: "alice",
        }),
        headers: {
          "X-CSRF-Token": csrfToken,
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("gère DELETE sans envoyer de corps JSON", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockCsrfSuccess())
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

    vi.stubGlobal("fetch", fetchMock);

    await deleteWithCsrf("/api/subscriptions/123");

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${API_URL}/api/subscriptions/123`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRF-Token": csrfToken,
        },
      },
    );
  });

  it("refuse les endpoints hors de l'API", async () => {
    const fetchMock = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      postWithCsrf("https://example.com/api/unsafe", {}),
    ).rejects.toThrow("Endpoint API invalide.");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bloque la mutation si le jeton CSRF ne peut pas être récupéré", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(postWithCsrf("/api/articles", {})).rejects.toThrow(
      "Impossible de récupérer le jeton CSRF.",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refuse un jeton CSRF malformé", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        csrfToken: "invalid-token",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(postWithCsrf("/api/articles", {})).rejects.toThrow();

    // La mutation ne doit jamais être envoyée.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
