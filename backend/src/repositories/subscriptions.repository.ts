import { prisma } from "../lib/prisma.js";

export const subscriptionsRepository = {
  /**
   * Liste les abonnements d'un utilisateur.
   *
   * @param userId - Identifiant issu de la session.
   */

  findByUser(userId: string) {
    return prisma.subscription.findMany({
      where: { userId },
      select: {
        topicId: true,
        createdAt: true,
        topic: {
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  /**
   * Vérifie qu'un thème existe.
   */
  findTopic(topicId: string) {
    return prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });
  },

  /**
   * Crée un abonnement utilisateur-thème.
   */
  create(userId: string, topicId: string) {
    return prisma.subscription.create({
      data: {
        userId,
        topicId,
      },
      select: {
        topicId: true,
        createdAt: true,
      },
    });
  },

  /**
   * Supprime un abonnement s'il existe.
   */
  remove(userId: string, topicId: string) {
    return prisma.subscription.deleteMany({
      where: {
        userId,
        topicId,
      },
    });
  },
};
