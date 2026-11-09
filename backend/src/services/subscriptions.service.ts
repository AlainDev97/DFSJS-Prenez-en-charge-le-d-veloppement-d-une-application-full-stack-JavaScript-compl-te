import { Prisma } from "../generated/prisma/client.js";
import { subscriptionsRepository } from "../repositories/subscriptions.repository.js";

/**
 * Signale qu'un thème demandé n'existe pas.
 */
export class TopicNotFoundError extends Error {
  constructor() {
    super("Thème introuvable.");
    this.name = "TopicNotFoundError";
  }
}

/**
 * Signale que l'utilisateur suit déjà le thème.
 */
export class AlreadySubscribedError extends Error {
  constructor() {
    super("Vous êtes déjà abonné à ce thème.");
    this.name = "AlreadySubscribedError";
  }
}

export const subscriptionsService = {
  /**
   * Récupère les thèmes suivis par un utilisateur.
   */
  getByUser(userId: string) {
    return subscriptionsRepository.findByUser(userId);
  },

  /**
   * Abonne un utilisateur à un thème existant.
   *
   * @throws TopicNotFoundError
   * @throws AlreadySubscribedError
   */
  async subscribe(userId: string, topicId: string) {
    const topic = await subscriptionsRepository.findTopic(topicId);

    if (!topic) {
      throw new TopicNotFoundError();
    }

    try {
      return await subscriptionsRepository.create(userId, topicId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new AlreadySubscribedError();
        }

        if (error.code === "P2003") {
          throw new TopicNotFoundError();
        }
      }

      throw error;
    }
  },

  /**
   * Supprime l'abonnement de l'utilisateur au thème.
   * L'opération est idempotente.
   */
  async unsubscribe(userId: string, topicId: string) {
    await subscriptionsRepository.remove(userId, topicId);
  },
};
