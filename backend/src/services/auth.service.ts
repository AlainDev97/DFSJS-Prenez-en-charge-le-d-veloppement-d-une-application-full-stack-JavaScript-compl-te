import argon2 from "argon2";
import { Prisma } from "../generated/prisma/client.js";

import { authRepository } from "../repositories/auth.repository.js";
import type { RegisterInput } from "../schemas/auth.schema.js";

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
};
