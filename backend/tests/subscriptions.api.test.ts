import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const authMock = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  getCurrentUser: vi.fn(),
}));

const subscriptionsMock = vi.hoisted(() => ({
  getByUser: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("../src/services/auth.service.js", () => ({
  authService: authMock,
  UserAlreadyExistsError: class extends Error {},
  InvalidCredentialsError: class extends Error {},
}));

vi.mock("../src/services/subscriptions.service.js", () => ({
  subscriptionsService: subscriptionsMock,
  TopicNotFoundError: class extends Error {
    constructor() {
      super("Thème introuvable.");
    }
  },
  AlreadySubscribedError: class extends Error {
    constructor() {
      super("Vous êtes déjà abonné à ce thème.");
    }
  },
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
      secret: "secret-pour-tests-uniquement-123456789012345",
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
  AlreadySubscribedError,
  TopicNotFoundError,
} from "../src/services/subscriptions.service.js";

const user = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  email: "alice@example.test",
  username: "alice",
};

const topicId = "223e4567-e89b-42d3-a456-426614174000";

/**
 * Génère un jeton CSRF associé à la session de test.
 */
async function getCsrfToken(
  agent: ReturnType<typeof request.agent>,
): Promise<string> {
  const response = await agent.get("/api/auth/csrf").expect(200);

  return response.body.csrfToken as string;
}

/**
 * Connecte un utilisateur fictif et conserve ses cookies.
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
      password: "PasswordDeTest123!",
    })
    .expect(200);

  return agent;
}

describe("API Subscriptions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("refuse la consultation sans connexion", async () => {
    await request(app).get("/api/subscriptions").expect(401);

    expect(subscriptionsMock.getByUser).not.toHaveBeenCalled();
  });

  it("refuse un abonnement sans connexion", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    await agent
      .post("/api/subscriptions")
      .set("X-CSRF-Token", csrfToken)
      .send({ topicId })
      .expect(401);

    expect(subscriptionsMock.subscribe).not.toHaveBeenCalled();
  });

  it("retourne les abonnements de l'utilisateur connecté", async () => {
    const agent = await createAuthenticatedAgent();

    subscriptionsMock.getByUser.mockResolvedValue([
      {
        topicId,
        createdAt: new Date("2026-11-09T12:00:00Z"),
      },
    ]);

    const response = await agent.get("/api/subscriptions").expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].topicId).toBe(topicId);

    expect(subscriptionsMock.getByUser).toHaveBeenCalledWith(user.id);
  });

  it("refuse un abonnement sans CSRF", async () => {
    const agent = await createAuthenticatedAgent();

    await agent.post("/api/subscriptions").send({ topicId }).expect(403);

    expect(subscriptionsMock.subscribe).not.toHaveBeenCalled();
  });

  it("crée un abonnement avec des données valides", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    subscriptionsMock.subscribe.mockResolvedValue({
      topicId,
      createdAt: new Date("2026-11-09T12:00:00Z"),
    });

    const response = await agent
      .post("/api/subscriptions")
      .set("X-CSRF-Token", csrfToken)
      .send({ topicId })
      .expect(201);

    expect(response.body.data.topicId).toBe(topicId);

    expect(subscriptionsMock.subscribe).toHaveBeenCalledWith(user.id, topicId);
  });

  it("refuse un identifiant de thème invalide", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    await agent
      .post("/api/subscriptions")
      .set("X-CSRF-Token", csrfToken)
      .send({ topicId: "invalid" })
      .expect(400);

    expect(subscriptionsMock.subscribe).not.toHaveBeenCalled();
  });

  it("renvoie 404 si le thème n'existe pas", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    subscriptionsMock.subscribe.mockRejectedValue(new TopicNotFoundError());

    await agent
      .post("/api/subscriptions")
      .set("X-CSRF-Token", csrfToken)
      .send({ topicId })
      .expect(404);
  });

  it("renvoie 409 si l'utilisateur est déjà abonné", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    subscriptionsMock.subscribe.mockRejectedValue(new AlreadySubscribedError());

    await agent
      .post("/api/subscriptions")
      .set("X-CSRF-Token", csrfToken)
      .send({ topicId })
      .expect(409);
  });

  it("refuse un désabonnement sans CSRF", async () => {
    const agent = await createAuthenticatedAgent();

    await agent.delete(`/api/subscriptions/${topicId}`).expect(403);

    expect(subscriptionsMock.unsubscribe).not.toHaveBeenCalled();
  });

  it("désabonne l'utilisateur connecté", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    subscriptionsMock.unsubscribe.mockResolvedValue(undefined);

    await agent
      .delete(`/api/subscriptions/${topicId}`)
      .set("X-CSRF-Token", csrfToken)
      .expect(204);

    expect(subscriptionsMock.unsubscribe).toHaveBeenCalledWith(
      user.id,
      topicId,
    );
  });

  it("refuse un identifiant invalide au désabonnement", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    await agent
      .delete("/api/subscriptions/invalid")
      .set("X-CSRF-Token", csrfToken)
      .expect(400);

    expect(subscriptionsMock.unsubscribe).not.toHaveBeenCalled();
  });

  it("protège également la liste des thèmes", async () => {
    await request(app).get("/api/topics").expect(401);
  });
});
