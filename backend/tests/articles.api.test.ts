import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const authMock = vi.hoisted(() => ({
  register: vi.fn(),
  login: vi.fn(),
  getCurrentUser: vi.fn(),
}));

const articlesMock = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
}));

const commentsMock = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock("../src/services/auth.service.js", () => ({
  authService: authMock,
  UserAlreadyExistsError: class extends Error {},
  InvalidCredentialsError: class extends Error {},
}));

vi.mock("../src/services/articles.service.js", () => ({
  articlesService: articlesMock,

  ArticleNotFoundError: class extends Error {
    constructor() {
      super("Article introuvable.");
    }
  },

  ArticleTopicNotFoundError: class extends Error {
    constructor() {
      super("Le thème sélectionné est introuvable.");
    }
  },
}));

vi.mock("../src/services/comments.service.js", () => ({
  commentsService: commentsMock,

  CommentArticleNotFoundError: class extends Error {
    constructor() {
      super("L'article demandé est introuvable.");
    }
  },
}));

// Évite les connexions à la véritable base PostgreSQL.
vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    topic: {
      count: vi.fn(),
    },
  },
}));

// Sessions éphémères pour les tests HTTP.
vi.mock("../src/middleware/session.middleware.js", async () => {
  const { default: session } = await import("express-session");

  return {
    sessionMiddleware: session({
      name: "mdd.sid",
      secret: "secret-de-test-uniquement-123456789012345",
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
  ArticleNotFoundError,
  ArticleTopicNotFoundError,
} from "../src/services/articles.service.js";

import { CommentArticleNotFoundError } from "../src/services/comments.service.js";

const user = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  email: "alice@example.test",
  username: "alice",
};

const articleId = "223e4567-e89b-42d3-a456-426614174000";
const topicId = "323e4567-e89b-42d3-a456-426614174000";
const commentId = "423e4567-e89b-42d3-a456-426614174000";

const articleInput = {
  title: "Découvrir les fonctionnalités de TypeScript",
  content:
    "TypeScript permet de sécuriser le développement " +
    "des applications JavaScript.",
  topicId,
};

const article = {
  id: articleId,
  title: articleInput.title,
  content: articleInput.content,
  createdAt: new Date("2026-11-10T12:00:00Z"),
  updatedAt: new Date("2026-11-10T12:00:00Z"),
  author: {
    username: user.username,
  },
  topic: {
    name: "TypeScript",
  },
  comments: [],
};

async function getCsrfToken(
  agent: ReturnType<typeof request.agent>,
): Promise<string> {
  const response = await agent.get("/api/auth/csrf").expect(200);

  expect(response.body.csrfToken).toMatch(/^[0-9a-f]{64}$/);

  return response.body.csrfToken as string;
}

/**
 * Crée une session authentifiée dans l'agent Supertest.
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

describe("API Articles et Commentaires", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ---------------------------------------------------
  // Consultation et tri des articles
  // ---------------------------------------------------

  it("refuse la liste des articles sans connexion", async () => {
    await request(app).get("/api/articles").expect(401);

    expect(articlesMock.getAll).not.toHaveBeenCalled();
  });

  it("retourne les articles avec le tri récent par défaut", async () => {
    const agent = await createAuthenticatedAgent();

    articlesMock.getAll.mockResolvedValue([
      {
        id: articleId,
        title: article.title,
        excerpt: article.content,
        createdAt: article.createdAt,
        author: article.author,
        topic: article.topic,
      },
    ]);

    const response = await agent.get("/api/articles").expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].title).toBe(article.title);

    expect(articlesMock.getAll).toHaveBeenCalledWith("newest");
  });

  it("accepte le tri par articles les plus anciens", async () => {
    const agent = await createAuthenticatedAgent();

    articlesMock.getAll.mockResolvedValue([]);

    await agent.get("/api/articles?sort=oldest").expect(200);

    expect(articlesMock.getAll).toHaveBeenCalledWith("oldest");
  });

  it("rejette un tri invalide", async () => {
    const agent = await createAuthenticatedAgent();

    await agent.get("/api/articles?sort=random").expect(400);

    expect(articlesMock.getAll).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------
  // Consultation détaillée
  // ---------------------------------------------------

  it("refuse le détail d'un article sans connexion", async () => {
    await request(app).get(`/api/articles/${articleId}`).expect(401);
  });

  it("retourne le détail complet d'un article", async () => {
    const agent = await createAuthenticatedAgent();

    articlesMock.getById.mockResolvedValue(article);

    const response = await agent.get(`/api/articles/${articleId}`).expect(200);

    expect(response.body.data.id).toBe(articleId);
    expect(response.body.data.content).toBe(article.content);
    expect(response.body.data.author.username).toBe("alice");

    expect(articlesMock.getById).toHaveBeenCalledWith(articleId);
  });

  it("refuse un identifiant d'article invalide", async () => {
    const agent = await createAuthenticatedAgent();

    await agent.get("/api/articles/invalid").expect(400);

    expect(articlesMock.getById).not.toHaveBeenCalled();
  });

  it("renvoie 404 si l'article n'existe pas", async () => {
    const agent = await createAuthenticatedAgent();

    articlesMock.getById.mockRejectedValue(new ArticleNotFoundError());

    await agent.get(`/api/articles/${articleId}`).expect(404);
  });

  // ---------------------------------------------------
  // Création d'articles
  // ---------------------------------------------------

  it("refuse la création sans authentification", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    await agent
      .post("/api/articles")
      .set("X-CSRF-Token", csrfToken)
      .send(articleInput)
      .expect(401);

    expect(articlesMock.create).not.toHaveBeenCalled();
  });

  it("refuse la création sans jeton CSRF", async () => {
    const agent = await createAuthenticatedAgent();

    await agent.post("/api/articles").send(articleInput).expect(403);

    expect(articlesMock.create).not.toHaveBeenCalled();
  });

  it("crée un article avec l'auteur de la session", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    articlesMock.create.mockResolvedValue({
      id: articleId,
      title: articleInput.title,
      topicId,
      createdAt: article.createdAt,
    });

    const response = await agent
      .post("/api/articles")
      .set("X-CSRF-Token", csrfToken)
      .send(articleInput)
      .expect(201);

    expect(response.body.data.id).toBe(articleId);

    expect(articlesMock.create).toHaveBeenCalledWith(user.id, articleInput);
  });

  it("refuse un article avec un contenu trop court", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    await agent
      .post("/api/articles")
      .set("X-CSRF-Token", csrfToken)
      .send({
        ...articleInput,
        content: "Trop court",
      })
      .expect(400);

    expect(articlesMock.create).not.toHaveBeenCalled();
  });

  it("refuse de choisir arbitrairement l'auteur", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    await agent
      .post("/api/articles")
      .set("X-CSRF-Token", csrfToken)
      .send({
        ...articleInput,
        authorId: "523e4567-e89b-42d3-a456-426614174000",
      })
      .expect(400);

    expect(articlesMock.create).not.toHaveBeenCalled();
  });

  it("renvoie 404 si le thème sélectionné n'existe pas", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    articlesMock.create.mockRejectedValue(new ArticleTopicNotFoundError());

    await agent
      .post("/api/articles")
      .set("X-CSRF-Token", csrfToken)
      .send(articleInput)
      .expect(404);
  });

  // ---------------------------------------------------
  // Publication des commentaires
  // ---------------------------------------------------

  it("refuse un commentaire sans connexion", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    await agent
      .post(`/api/articles/${articleId}/comments`)
      .set("X-CSRF-Token", csrfToken)
      .send({ content: "Très bon article !" })
      .expect(401);

    expect(commentsMock.create).not.toHaveBeenCalled();
  });

  it("refuse un commentaire sans jeton CSRF", async () => {
    const agent = await createAuthenticatedAgent();

    await agent
      .post(`/api/articles/${articleId}/comments`)
      .send({ content: "Très bon article !" })
      .expect(403);

    expect(commentsMock.create).not.toHaveBeenCalled();
  });

  it("publie un commentaire pour l'utilisateur connecté", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    commentsMock.create.mockResolvedValue({
      id: commentId,
      content: "Très bon article !",
      createdAt: new Date("2026-11-10T13:00:00Z"),
      author: {
        username: user.username,
      },
    });

    const response = await agent
      .post(`/api/articles/${articleId}/comments`)
      .set("X-CSRF-Token", csrfToken)
      .send({ content: "Très bon article !" })
      .expect(201);

    expect(response.body.data.id).toBe(commentId);
    expect(response.body.data.author.username).toBe("alice");

    expect(commentsMock.create).toHaveBeenCalledWith(
      user.id,
      articleId,
      "Très bon article !",
    );
  });

  it("refuse un commentaire vide", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    await agent
      .post(`/api/articles/${articleId}/comments`)
      .set("X-CSRF-Token", csrfToken)
      .send({ content: "   " })
      .expect(400);

    expect(commentsMock.create).not.toHaveBeenCalled();
  });

  it("refuse un identifiant d'article invalide", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    await agent
      .post("/api/articles/invalid/comments")
      .set("X-CSRF-Token", csrfToken)
      .send({ content: "Très bon article !" })
      .expect(400);

    expect(commentsMock.create).not.toHaveBeenCalled();
  });

  it("renvoie 404 si l'article à commenter n'existe pas", async () => {
    const agent = await createAuthenticatedAgent();
    const csrfToken = await getCsrfToken(agent);

    commentsMock.create.mockRejectedValue(new CommentArticleNotFoundError());

    await agent
      .post(`/api/articles/${articleId}/comments`)
      .set("X-CSRF-Token", csrfToken)
      .send({ content: "Très bon article !" })
      .expect(404);
  });
});
