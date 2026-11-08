import argon2 from "argon2";
import { Prisma } from "../generated/prisma/client.js";

import { authRepository } from "../repositories/auth.repository.js";
import type { RegisterInput } from "../schemas/auth.schema.js";
import type { LoginInput } from "../schemas/auth.schema.js";

/**
 * Erreur métier signalant un conflit avec
 * un email ou un pseudo déjà enregistré.
 */
export class UserAlreadyExistsError extends Error {
  constructor() {
    super("Email ou pseudo déjà utilisé.");
    this.name = "UserAlreadyExistsError";
  }
}

/**
 * Erreur métier levée lorsque les identifiants sont invalides.
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super("Email ou mot de passe incorrect.");
    this.name = "InvalidCredentialsError";
  }
}

export const authService = {
  /**
   * Crée un compte utilisateur.
   *
   * @param data - Données validées par le contrôleur.
   * @returns Informations publiques du compte créé.
   * @throws UserAlreadyExistsError en cas de doublon.
   */
  async register(data: RegisterInput) {
    const passwordHash = await argon2.hash(data.password);

    try {
      return await authRepository.createUser({
        email: data.email,
        username: data.username,
        passwordHash,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new UserAlreadyExistsError();
      }

      throw error;
    }
  },

  /**
   * Authentifie un utilisateur à partir de ses identifiants.
   *
   * @param data - Email et mot de passe validés.
   * @returns Les informations publiques de l'utilisateur.
   * @throws InvalidCredentialsError si l'authentification échoue.
   */
  async login(data: LoginInput) {
    const user = await authRepository.findByEmail(data.email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordIsValid = await argon2.verify(
      user.passwordHash,
      data.password,
    );

    if (!passwordIsValid) {
      throw new InvalidCredentialsError();
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  },

  /**
   * Récupère l'utilisateur associé à une session.
   */
  getCurrentUser(userId: string) {
    return authRepository.findPublicById(userId);
  },
};
