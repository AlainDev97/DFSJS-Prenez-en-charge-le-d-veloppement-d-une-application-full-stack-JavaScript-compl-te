import { prisma } from "../lib/prisma.js";

type CreateUserData = {
  email: string;
  username: string;
  passwordHash: string;
};

export const authRepository = {
  /**
   * Enregistre un utilisateur et retourne uniquement
   * ses informations publiques.
   *
   * @param data - Informations validées et mot de passe haché.
   * @returns L'utilisateur créé, sans son passwordHash.
   */
  createUser(data: CreateUserData) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });
  },

  /**
   * Recherche un utilisateur par adresse e-mail.
   * Le hash est récupéré uniquement pour vérifier le mot de passe.
   */
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
      },
    });
  },

  /**
   * Récupère le profil public d'un utilisateur.
   */
  findPublicById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });
  },

  /**
   * Récupère le hash uniquement pour vérifier
   * l'identité avant une modification du profil.
   */
  findPrivateById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        passwordHash: true,
      },
    });
  },

  /**
   * Met à jour le compte et renvoie seulement
   * les informations non sensibles.
   */
  updateProfile(
    id: string,
    data: {
      username: string;
      email: string;
      passwordHash?: string;
    },
  ) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
      },
    });
  },
};
