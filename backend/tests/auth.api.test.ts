import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// Simulation du service métier : aucune écriture en PostgreSQL.
const service = vi.hoisted(() => ({
  register: vi.fn(),
  login: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("../src/services/auth.service.js", () => {
  class UserAlreadyExistsError extends Error {}
  class InvalidCredentialsError extends Error {}

  return {
    authService: service,
    UserAlreadyExistsError,
    InvalidCredentialsError,
  };
});

// Empêche toute connexion au vrai client Prisma.
vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    topic: {
      count: vi.fn(),
    },
  },
}));

// Utilise un stockage de session éphémère pour les tests.
vi.mock("../src/middleware/session.middleware.js", async () => {
  const { default: session } = await import("express-session");

  return {
    sessionMiddleware: session({
      name: "mdd.sid",
      secret: "secret-de-test-uniquement-pour-vitest-123456",
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
  UserAlreadyExistsError,
} from "../src/services/auth.service.js";

const user = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  email: "alice@example.test",
  username: "alice",
};

const credentials = {
  email: user.email,
  password: "PasswordDeTest123!",
};

const registration = {
  ...credentials,
  username: user.username,
};

/**
 * Récupère un jeton CSRF associé aux cookies de l'agent.
 */
async function getCsrfToken(agent: ReturnType<typeof request.agent>) {
  const response = await agent.get("/api/auth/csrf").expect(200);

  expect(response.body.csrfToken).toMatch(/^[0-9a-f]{64}$/);

  return response.body.csrfToken as string;
}

describe("API Auth - Tests HTTP", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("crée une session CSRF avec un cookie HttpOnly", async () => {
    const agent = request.agent(app);

    const response = await agent.get("/api/auth/csrf").expect(200);

    expect(response.body.csrfToken).toMatch(/^[0-9a-f]{64}$/);

    const cookies = response.headers["set-cookie"] as unknown as string[];

    expect(cookies.some((cookie) => cookie.includes("HttpOnly"))).toBe(true);

    expect(cookies.some((cookie) => cookie.includes("SameSite=Lax"))).toBe(
      true,
    );
  });

  it("refuse une inscription sans jeton CSRF", async () => {
    await request(app)
      .post("/api/auth/register")
      .send(registration)
      .expect(403);

    expect(service.register).not.toHaveBeenCalled();
  });

  it("refuse un jeton CSRF invalide", async () => {
    const agent = request.agent(app);
    await getCsrfToken(agent);

    await agent
      .post("/api/auth/register")
      .set("X-CSRF-Token", "0".repeat(64))
      .send(registration)
      .expect(403);
  });

  it("inscrit un utilisateur avec des données valides", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    service.register.mockResolvedValue({
      ...user,
      createdAt: new Date("2026-11-08T12:00:00Z"),
    });

    const response = await agent
      .post("/api/auth/register")
      .set("X-CSRF-Token", csrfToken)
      .send(registration)
      .expect(201);

    expect(response.body.data.email).toBe(user.email);
    expect(response.body.data.username).toBe(user.username);
    expect(response.body.data).not.toHaveProperty("passwordHash");

    expect(service.register).toHaveBeenCalledWith(registration);
  });

  it("refuse les données d'inscription invalides", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    await agent
      .post("/api/auth/register")
      .set("X-CSRF-Token", csrfToken)
      .send({
        email: "invalide",
        username: "ab",
        password: "123",
      })
      .expect(400);

    expect(service.register).not.toHaveBeenCalled();
  });

  it("renvoie 409 si un compte existe déjà", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    service.register.mockRejectedValue(new UserAlreadyExistsError());

    await agent
      .post("/api/auth/register")
      .set("X-CSRF-Token", csrfToken)
      .send(registration)
      .expect(409);
  });

  it("refuse une connexion avec de mauvais identifiants", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    service.login.mockRejectedValue(new InvalidCredentialsError());

    await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send(credentials)
      .expect(401);
  });

  it("interdit /me sans authentification", async () => {
    await request(app).get("/api/auth/me").expect(401);
  });

  it("connecte l'utilisateur et conserve sa session", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    service.login.mockResolvedValue(user);
    service.getCurrentUser.mockResolvedValue(user);

    const loginResponse = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send(credentials)
      .expect(200);

    expect(loginResponse.body.data.id).toBe(user.id);

    const meResponse = await agent.get("/api/auth/me").expect(200);

    expect(meResponse.body.data).toEqual(user);
    expect(service.getCurrentUser).toHaveBeenCalledWith(user.id);
  });

  it("détruit la session lors de la déconnexion", async () => {
    const agent = request.agent(app);
    const initialCsrf = await getCsrfToken(agent);

    service.login.mockResolvedValue(user);
    service.getCurrentUser.mockResolvedValue(user);

    await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", initialCsrf)
      .send(credentials)
      .expect(200);

    await agent.get("/api/auth/me").expect(200);

    // La connexion régénère la session, donc le jeton change.
    const newCsrf = await getCsrfToken(agent);

    await agent
      .post("/api/auth/logout")
      .set("X-CSRF-Token", newCsrf)
      .expect(204);

    await agent.get("/api/auth/me").expect(401);
  });
});
