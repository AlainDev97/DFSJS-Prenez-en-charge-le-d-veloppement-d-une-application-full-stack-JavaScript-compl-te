import { prisma } from "../lib/prisma.js";

export type ArticleSort = "newest" | "oldest";

export const articlesRepository = {
  /**
   * Récupère les articles et leurs auteurs.
   * Le tri est effectué directement dans PostgreSQL.
   */
  findAll(sort: ArticleSort = "newest") {
    return prisma.post.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            username: true,
          },
        },
        topic: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        {
          createdAt: sort === "newest" ? "desc" : "asc",
        },
        {
          id: "desc",
        },
      ],
      take: 50,
    });
  },

  /**
   * Vérifie l'existence du thème sélectionné.
   */
  findTopicById(topicId: string) {
    return prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });
  },

  /**
   * Persiste un article et retourne les informations
   * nécessaires à la confirmation de sa création.
   */
  create(data: {
    title: string;
    content: string;
    topicId: string;
    authorId: string;
  }) {
    return prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        topicId: data.topicId,
        authorId: data.authorId,
      },
      select: {
        id: true,
        title: true,
        topicId: true,
        createdAt: true,
      },
    });
  },

  /**
   * Récupère un article avec son auteur et son thème.
   */
  findById(id: string) {
    return prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            username: true,
          },
        },
        topic: {
          select: {
            name: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  },
};
