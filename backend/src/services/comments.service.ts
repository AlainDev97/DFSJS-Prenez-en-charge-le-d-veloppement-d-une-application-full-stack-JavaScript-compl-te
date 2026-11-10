import { commentsRepository } from "../repositories/comments.repository.js";

/**
 * Erreur métier lorsqu'un article n'existe pas.
 */
export class CommentArticleNotFoundError extends Error {
  constructor() {
    super("L'article demandé est introuvable.");
    this.name = "CommentArticleNotFoundError";
  }
}

export const commentsService = {
  /**
   * Ajoute un commentaire à un article existant.
   *
   * @param authorId - Utilisateur issu de la session.
   * @param postId - Article concerné.
   * @param content - Commentaire validé par Zod.
   */
  async create(authorId: string, postId: string, content: string) {
    const article = await commentsRepository.findArticleById(postId);

    if (!article) {
      throw new CommentArticleNotFoundError();
    }

    return commentsRepository.create({
      authorId,
      postId,
      content,
    });
  },
};
