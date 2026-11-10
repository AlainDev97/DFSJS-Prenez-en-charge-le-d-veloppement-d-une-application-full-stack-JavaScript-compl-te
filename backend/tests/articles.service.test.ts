import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  findAll: vi.fn(),
  findTopicById: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
}));

vi.mock("../src/repositories/articles.repository.js", () => ({
  articlesRepository: repository,
}));

import {
  articlesService,
  ArticleNotFoundError,
  ArticleTopicNotFoundError,
} from "../src/services/articles.service.js";

const authorId = "123e4567-e89b-42d3-a456-426614174000";
const topicId = "223e4567-e89b-42d3-a456-426614174000";
const articleId = "323e4567-e89b-42d3-a456-426614174000";

const articleInput = {
  title: "Comprendre TypeScript",
  content: "TypeScript ajoute un système de types à JavaScript.",
  topicId,
};

describe("ArticlesService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("retourne les articles avec leur extrait sans exposer le contenu complet", async () => {
    repository.findAll.mockResolvedValue([
      {
        id: articleId,
        title: articleInput.title,
        content: articleInput.content,
      },
    ]);

    const result = await articlesService.getAll();

    expect(repository.findAll).toHaveBeenCalledWith("newest");
    expect(result[0].excerpt).toBe(articleInput.content);
    expect(result[0]).not.toHaveProperty("content");
  });

  it("tronque les contenus dépassant 180 caractères", async () => {
    const longContent = "A".repeat(250);

    repository.findAll.mockResolvedValue([
      {
        id: articleId,
        title: articleInput.title,
        content: longContent,
      },
    ]);

    const result = await articlesService.getAll();

    expect(result[0].excerpt).toBe("A".repeat(180) + "…");
    expect(result[0].excerpt.length).toBe(181);
  });

  it("transmet le tri oldest au repository", async () => {
    repository.findAll.mockResolvedValue([]);

    const result = await articlesService.getAll("oldest");

    expect(repository.findAll).toHaveBeenCalledWith("oldest");
    expect(result).toEqual([]);
  });

  it("crée un article associé à son auteur", async () => {
    repository.findTopicById.mockResolvedValue({ id: topicId });

    repository.create.mockResolvedValue({
      id: articleId,
      ...articleInput,
    });

    const result = await articlesService.create(authorId, articleInput);

    expect(repository.findTopicById).toHaveBeenCalledWith(topicId);

    expect(repository.create).toHaveBeenCalledWith({
      ...articleInput,
      authorId,
    });

    expect(result.id).toBe(articleId);
  });

  it("refuse la création si le thème n'existe pas", async () => {
    repository.findTopicById.mockResolvedValue(null);

    await expect(
      articlesService.create(authorId, articleInput),
    ).rejects.toBeInstanceOf(ArticleTopicNotFoundError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it("propage une erreur de persistance lors de la création", async () => {
    repository.findTopicById.mockResolvedValue({ id: topicId });
    repository.create.mockRejectedValue(new Error("Database unavailable"));

    await expect(
      articlesService.create(authorId, articleInput),
    ).rejects.toThrow("Database unavailable");
  });

  it("retourne le détail d'un article existant", async () => {
    const article = {
      id: articleId,
      title: articleInput.title,
      content: articleInput.content,
      comments: [],
    };

    repository.findById.mockResolvedValue(article);

    const result = await articlesService.getById(articleId);

    expect(repository.findById).toHaveBeenCalledWith(articleId);
    expect(result).toEqual(article);
  });

  it("lève ArticleNotFoundError si l'article est introuvable", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(articlesService.getById(articleId)).rejects.toBeInstanceOf(
      ArticleNotFoundError,
    );
  });
});
