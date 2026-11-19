import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

// Simule Prisma : aucune connexion PostgreSQL réelle.
const db = vi.hoisted(() => ({
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  post: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  topic: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  subscription: {
    findMany: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  comment: {
    create: vi.fn(),
  },
}));

vi.mock("../src/lib/prisma.js", () => ({
  prisma: db,
}));

import { authRepository } from "../src/repositories/auth.repository.js";
import { articlesRepository } from "../src/repositories/articles.repository.js";
import { subscriptionsRepository } from "../src/repositories/subscriptions.repository.js";
import { commentsRepository } from "../src/repositories/comments.repository.js";
import { topicsRepository } from "../src/repositories/topics.repository.js";
import { topicsService } from "../src/services/topics.service.js";
import { topicsController } from "../src/controllers/topics.controller.js";

const userId = "123e4567-e89b-42d3-a456-426614174000";
const topicId = "223e4567-e89b-42d3-a456-426614174000";
const articleId = "323e4567-e89b-42d3-a456-426614174000";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("AuthRepository", () => {
  it("crée un compte sans retourner le hash du mot de passe", async () => {
    const data = {
      email: "alice@example.test",
      username: "alice",
      passwordHash: "hashed-password",
    };

    const result = { id: userId, ...data };
    db.user.create.mockResolvedValue(result);

    await authRepository.createUser(data);

    expect(db.user.create).toHaveBeenCalledWith({
      data,
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    expect(db.user.create.mock.calls[0][0].select).not.toHaveProperty(
      "passwordHash",
    );
  });

  it("récupère le hash uniquement pour l'authentification", async () => {
    await authRepository.findByEmail("alice@example.test");

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: "alice@example.test" },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
      },
    });
  });

  it("sépare les lectures du profil public et privé", async () => {
    await authRepository.findPublicById(userId);
    await authRepository.findPrivateById(userId);

    expect(db.user.findUnique).toHaveBeenNthCalledWith(1, {
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    expect(db.user.findUnique).toHaveBeenNthCalledWith(2, {
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });
  });

  it("met à jour un utilisateur sans retourner son hash", async () => {
    const data = {
      username: "alice_dev",
      email: "alice@example.test",
      passwordHash: "new-hash",
    };

    await authRepository.updateProfile(userId, data);

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
      },
    });
  });
});

describe("ArticlesRepository", () => {
  it("liste uniquement les articles des thèmes suivis, du plus récent au plus ancien", async () => {
    await articlesRepository.findAll(userId);

    expect(db.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          topic: {
            subscriptions: {
              some: {
                userId,
              },
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 50,
      }),
    );
  });

  it("conserve le filtre des abonnements avec le tri croissant", async () => {
    await articlesRepository.findAll(userId, "oldest");

    expect(db.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          topic: {
            subscriptions: {
              some: {
                userId,
              },
            },
          },
        },
        orderBy: [{ createdAt: "asc" }, { id: "desc" }],
      }),
    );
  });

  it("vérifie l'existence d'un thème", async () => {
    await articlesRepository.findTopicById(topicId);

    expect(db.topic.findUnique).toHaveBeenCalledWith({
      where: { id: topicId },
      select: { id: true },
    });
  });

  it("crée un article associé à son auteur", async () => {
    const data = {
      title: "Comprendre TypeScript",
      content: "Un contenu suffisamment long.",
      topicId,
      authorId: userId,
    };

    await articlesRepository.create(data);

    expect(db.post.create).toHaveBeenCalledWith({
      data,
      select: {
        id: true,
        title: true,
        topicId: true,
        createdAt: true,
      },
    });
  });

  it("charge les commentaires et leurs auteurs dans le détail", async () => {
    await articlesRepository.findById(articleId);

    expect(db.post.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: articleId },
        select: expect.objectContaining({
          comments: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              author: {
                select: { username: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        }),
      }),
    );
  });
});

describe("SubscriptionsRepository", () => {
  it("liste les abonnements d'un utilisateur", async () => {
    await subscriptionsRepository.findByUser(userId);

    expect(db.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("vérifie l'existence d'un thème", async () => {
    await subscriptionsRepository.findTopic(topicId);

    expect(db.topic.findUnique).toHaveBeenCalledWith({
      where: { id: topicId },
      select: { id: true },
    });
  });

  it("crée un abonnement utilisateur-thème", async () => {
    await subscriptionsRepository.create(userId, topicId);

    expect(db.subscription.create).toHaveBeenCalledWith({
      data: { userId, topicId },
      select: {
        topicId: true,
        createdAt: true,
      },
    });
  });

  it("supprime uniquement l'abonnement demandé", async () => {
    await subscriptionsRepository.remove(userId, topicId);

    expect(db.subscription.deleteMany).toHaveBeenCalledWith({
      where: { userId, topicId },
    });
  });
});

describe("CommentsRepository", () => {
  it("vérifie l'article avant la création", async () => {
    await commentsRepository.findArticleById(articleId);

    expect(db.post.findUnique).toHaveBeenCalledWith({
      where: { id: articleId },
      select: { id: true },
    });
  });

  it("crée un commentaire avec l'auteur de la session", async () => {
    const data = {
      postId: articleId,
      authorId: userId,
      content: "Très bon article !",
    };

    await commentsRepository.create(data);

    expect(db.comment.create).toHaveBeenCalledWith({
      data,
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: { username: true },
        },
      },
    });
  });
});

describe("TopicsRepository et TopicsService", () => {
  it("liste les thèmes sans filtre", async () => {
    await topicsRepository.findAll();

    expect(db.topic.findMany).toHaveBeenCalledWith({
      where: undefined,
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: "asc" },
      take: 50,
    });
  });

  it("utilise une recherche insensible à la casse", async () => {
    await topicsRepository.findAll("React");

    expect(db.topic.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: {
            contains: "React",
            mode: "insensitive",
          },
        },
      }),
    );
  });

  it("transmet le filtre du service vers le repository", async () => {
    db.topic.findMany.mockResolvedValue([{ id: topicId, name: "React" }]);

    const result = await topicsService.getAll("React");

    expect(result).toEqual([{ id: topicId, name: "React" }]);

    expect(db.topic.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: {
            contains: "React",
            mode: "insensitive",
          },
        },
      }),
    );
  });
});

describe("TopicsController", () => {
  function createResponse() {
    const status = vi.fn();
    const json = vi.fn();

    const res = { status, json } as unknown as Response;
    status.mockReturnValue(res);

    return { res, status, json };
  }

  it("retourne les thèmes filtrés avec HTTP 200", async () => {
    const topics = [{ id: topicId, name: "React" }];
    db.topic.findMany.mockResolvedValue(topics);

    const req = {
      query: { search: "React" },
    } as unknown as Request;

    const { res, status, json } = createResponse();

    await topicsController.getAll(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ data: topics });
  });

  it("refuse une recherche trop longue avec HTTP 400", async () => {
    const req = {
      query: { search: "a".repeat(101) },
    } as unknown as Request;

    const { res, status, json } = createResponse();

    await topicsController.getAll(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "Paramètres de recherche invalides",
    });

    expect(db.topic.findMany).not.toHaveBeenCalled();
  });

  it("rejette les paramètres inconnus", async () => {
    const req = {
      query: { unexpected: "value" },
    } as unknown as Request;

    const { res, status } = createResponse();

    await topicsController.getAll(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(db.topic.findMany).not.toHaveBeenCalled();
  });
});
