import {
  articlesRepository,
  type ArticleSort,
} from "../repositories/articles.repository.js";

const EXCERPT_LENGTH = 180;

/**
 * Erreur métier : le thème demandé n'existe pas.
 */
export class ArticleTopicNotFoundError extends Error {
  constructor() {
    super("Le thème sélectionné est introuvable.");
    this.name = "ArticleTopicNotFoundError";
  }
}

export class ArticleNotFoundError extends Error {
  constructor() {
    super("Article introuvable.");
    this.name = "ArticleNotFoundError";
  }
}

export const articlesService = {
  /**
   * Récupère les articles avec un extrait de leur contenu.
   *
   * On conserve le contenu intégral en base, mais on
   * ne l'envoie pas dans la réponse de la liste.
   */
  async getAll(sort: ArticleSort = "newest") {
    const articles = await articlesRepository.findAll(sort);

    return articles.map(({ content, ...article }) => ({
      ...article,
      excerpt:
        content.length > EXCERPT_LENGTH
          ? `${content.slice(0, EXCERPT_LENGTH).trimEnd()}…`
          : content,
    }));
  },

  /**
   * Crée un article pour l'utilisateur connecté.
   *
   * L'identifiant de l'auteur provient de la session
   * Express, jamais du formulaire.
   */
  async create(
    authorId: string,
    data: {
      title: string;
      content: string;
      topicId: string;
    },
  ) {
    const topic = await articlesRepository.findTopicById(data.topicId);

    if (!topic) {
      throw new ArticleTopicNotFoundError();
    }

    return articlesRepository.create({
      ...data,
      authorId,
    });
  },

  /**
   * Récupère un article complet.
   *
   * @throws ArticleNotFoundError si l'article n'existe pas.
   */
  async getById(id: string) {
    const article = await articlesRepository.findById(id);

    if (!article) {
      throw new ArticleNotFoundError();
    }

    return article;
  },
};
