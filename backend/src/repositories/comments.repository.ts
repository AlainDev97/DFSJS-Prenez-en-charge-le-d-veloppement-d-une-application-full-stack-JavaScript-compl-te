import { prisma } from "../lib/prisma.js";

type CreateCommentData = {
  postId: string;
  authorId: string;
  content: string;
};

export const commentsRepository = {
  /**
   * Vérifie que l'article existe.
   */
  findArticleById(postId: string) {
    return prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
  },

  /**
   * Enregistre un commentaire dans PostgreSQL.
   * Retourne les données nécessaires à l'affichage.
   */
  create(data: CreateCommentData) {
    return prisma.comment.create({
      data: {
        postId: data.postId,
        authorId: data.authorId,
        content: data.content,
      },
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
    });
  },
};
