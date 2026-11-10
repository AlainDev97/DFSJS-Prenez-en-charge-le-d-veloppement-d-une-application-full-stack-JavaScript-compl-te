import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  findArticleById: vi.fn(),
  create: vi.fn(),
}));

vi.mock("../src/repositories/comments.repository.js", () => ({
  commentsRepository: repository,
}));

import {
  commentsService,
  CommentArticleNotFoundError,
} from "../src/services/comments.service.js";

const authorId = "123e4567-e89b-42d3-a456-426614174000";
const articleId = "223e4567-e89b-42d3-a456-426614174000";

const content = "Excellent article, merci pour le partage !";

describe("CommentsService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("crée un commentaire pour l'article et l'auteur", async () => {
    repository.findArticleById.mockResolvedValue({
      id: articleId,
    });

    repository.create.mockResolvedValue({
      id: "323e4567-e89b-42d3-a456-426614174000",
      content,
      author: {
        username: "alice",
      },
    });

    const result = await commentsService.create(authorId, articleId, content);

    expect(repository.findArticleById).toHaveBeenCalledWith(articleId);

    expect(repository.create).toHaveBeenCalledWith({
      authorId,
      postId: articleId,
      content,
    });

    expect(result.content).toBe(content);
    expect(result.author.username).toBe("alice");
  });

  it("refuse un commentaire sur un article inexistant", async () => {
    repository.findArticleById.mockResolvedValue(null);

    await expect(
      commentsService.create(authorId, articleId, content),
    ).rejects.toBeInstanceOf(CommentArticleNotFoundError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it("propage une erreur de persistance", async () => {
    repository.findArticleById.mockResolvedValue({
      id: articleId,
    });

    repository.create.mockRejectedValue(new Error("Database unavailable"));

    await expect(
      commentsService.create(authorId, articleId, content),
    ).rejects.toThrow("Database unavailable");
  });
});
