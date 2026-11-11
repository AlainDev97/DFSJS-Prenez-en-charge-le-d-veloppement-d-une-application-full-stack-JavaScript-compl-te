import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const authMock = vi.hoisted(() => ({
  register: vi.fn(),
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("../src/services/auth.service.js", () => ({
  authService: authMock,
  UserAlreadyExistsError: class extends Error {},
  InvalidCredentialsError: class extends Error {},
  ProfileSessionInvalidError: class extends Error {},
}));

vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    topic: {
      count: vi.fn(),
    },
  },
}));

vi.mock("../src/middleware/session.middleware.js", async () => {
  const { default: session } = await import("express-session");

  return {
    sessionMiddleware: session({
      name: "mdd.sid",
      secret: "secret-pour-tests-profil-12345678901234567890",
      store: new session.MemoryStore(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
      },
    }),
  };
});

import { app } from "../src/app.js";

import {
  InvalidCredentialsError,
  ProfileSessionInvalidError,
  UserAlreadyExistsError,
} from "../src/services/auth.service.js";

const user = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  username: "alice",
  email: "alice@example.test",
};

const updateInput = {
  username: "alice_dev",
  email: "alice@example.test",
  currentPassword: "MotDePasseActuel123!",
};

async function getCsrfToken(
  agent: ReturnType<typeof request.agent>,
): Promise<string> {
  const response = await agent.get("/api/auth/csrf").expect(200);

  expect(response.body.csrfToken).toMatch(/^[0-9a-f]{64}$/);

  return response.body.csrfToken as string;
}

/**
 * Crée une session utilisateur fictive.
 */
async function createAuthenticatedAgent() {
  const agent = request.agent(app);
  const csrfToken = await getCsrfToken(agent);

  authMock.login.mockResolvedValue(user);

  await agent
    .post("/api/auth/login")
    .set("X-CSRF-Token", csrfToken)
    .send({
      email: user.email,
      password: "MotDePasseActuel123!",
    })
    .expect(200);

  return agent;
}

describe("API Profil utilisateur", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("refuse une modification sans authentification", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    await agent
      .patch("/api/auth/me")
      .set("X-CSRF-Token", csrfToken)
      .send(updateInput)
      .expect(401);

    expect(authMock.updateProfile).not.toHaveBeenCalled();
  });

  it("refuse une modification sans jeton CSRF", async () => {
    const agent = await createAuthenticatedAgent();

    await agent.patch("/api/auth/me").send(updateInput).expect(403);

    expect(authMock.updateProfile).not.toHaveBeenCalled();
  });

  it("refuse une adresse email invalide", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    await agent
      .patch("/api/auth/me")
      .set("X-CSRF-Token", csrfToken)
      .send({
        ...updateInput,
        email: "email-invalide",
      })
      .expect(400);

    expect(authMock.updateProfile).not.toHaveBeenCalled();
  });

  it("refuse des champs supplémentaires inattendus", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    await agent
      .patch("/api/auth/me")
      .set("X-CSRF-Token", csrfToken)
      .send({
        ...updateInput,
        userId: "223e4567-e89b-42d3-a456-426614174000",
      })
      .expect(400);

    expect(authMock.updateProfile).not.toHaveBeenCalled();
  });

  it("modifie le compte de l'utilisateur connecté", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    authMock.updateProfile.mockResolvedValue({
      ...user,
      username: "alice_dev",
    });

    const response = await agent
      .patch("/api/auth/me")
      .set("X-CSRF-Token", csrfToken)
      .send(updateInput)
      .expect(200);

    expect(response.body.data.username).toBe("alice_dev");
    expect(response.body.data).not.toHaveProperty("passwordHash");

    expect(authMock.updateProfile).toHaveBeenCalledWith(user.id, updateInput);
  });

  it("accepte une demande de changement de mot de passe", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    authMock.updateProfile.mockResolvedValue(user);

    const input = {
      ...updateInput,
      newPassword: "NouveauMotDePasse123!",
    };

    await agent
      .patch("/api/auth/me")
      .set("X-CSRF-Token", csrfToken)
      .send(input)
      .expect(200);

    expect(authMock.updateProfile).toHaveBeenCalledWith(user.id, input);
  });

  it("refuse un nouveau mot de passe trop court", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    await agent
      .patch("/api/auth/me")
      .set("X-CSRF-Token", csrfToken)
      .send({
        ...updateInput,
        newPassword: "123",
      })
      .expect(400);

    expect(authMock.updateProfile).not.toHaveBeenCalled();
  });

  it("refuse un mot de passe actuel incorrect", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    authMock.updateProfile.mockRejectedValue(new InvalidCredentialsError());

    await agent
      .patch("/api/auth/me")
      .set("X-CSRF-Token", csrfToken)
      .send(updateInput)
      .expect(401);
  });

  it("renvoie 401 si la session utilisateur est invalide", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    authMock.updateProfile.mockRejectedValue(new ProfileSessionInvalidError());

    await agent
      .patch("/api/auth/me")
      .set("X-CSRF-Token", csrfToken)
      .send(updateInput)
      .expect(401);
  });

  it("renvoie 409 si le pseudo ou l'email existe déjà", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    authMock.updateProfile.mockRejectedValue(new UserAlreadyExistsError());

    await agent
      .patch("/api/auth/me")
      .set("X-CSRF-Token", csrfToken)
      .send(updateInput)
      .expect(409);
  });
});
