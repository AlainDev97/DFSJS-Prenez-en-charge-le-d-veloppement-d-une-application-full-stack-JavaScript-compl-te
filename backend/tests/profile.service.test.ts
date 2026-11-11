import argon2 from "argon2";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "../src/generated/prisma/client.js";

const repository = vi.hoisted(() => ({
  createUser: vi.fn(),
  findByEmail: vi.fn(),
  findPublicById: vi.fn(),
  findPrivateById: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("../src/repositories/auth.repository.js", () => ({
  authRepository: repository,
}));

import {
  authService,
  InvalidCredentialsError,
  ProfileSessionInvalidError,
  UserAlreadyExistsError,
} from "../src/services/auth.service.js";

const userId = "123e4567-e89b-42d3-a456-426614174000";

const currentPassword = "MotDePasseActuel123!";
const newPassword = "NouveauMotDePasse123!";

const input = {
  username: "alice_dev",
  email: "alice@example.test",
  currentPassword,
};

let existingPasswordHash: string;

describe("AuthService - Modification du profil", () => {
  beforeAll(async () => {
    existingPasswordHash = await argon2.hash(currentPassword);
  });

  beforeEach(() => {
    vi.resetAllMocks();

    repository.findPrivateById.mockResolvedValue({
      id: userId,
      passwordHash: existingPasswordHash,
    });
  });

  it("modifie le profil après vérification du mot de passe", async () => {
    const updatedUser = {
      id: userId,
      username: input.username,
      email: input.email,
    };

    repository.updateProfile.mockResolvedValue(updatedUser);

    const result = await authService.updateProfile(userId, input);

    expect(repository.findPrivateById).toHaveBeenCalledWith(userId);

    expect(repository.updateProfile).toHaveBeenCalledWith(userId, {
      username: input.username,
      email: input.email,
    });

    expect(result).toEqual(updatedUser);
  });

  it("hache le nouveau mot de passe avec Argon2", async () => {
    repository.updateProfile.mockResolvedValue({
      id: userId,
      username: input.username,
      email: input.email,
    });

    await authService.updateProfile(userId, {
      ...input,
      newPassword,
    });

    const updateData = repository.updateProfile.mock.calls[0][1];

    expect(updateData.passwordHash).not.toBe(newPassword);
    expect(updateData.passwordHash).toMatch(/^\$argon2/);

    expect(await argon2.verify(updateData.passwordHash, newPassword)).toBe(
      true,
    );

    expect(await argon2.verify(updateData.passwordHash, currentPassword)).toBe(
      false,
    );
  });

  it("refuse un mot de passe actuel incorrect", async () => {
    await expect(
      authService.updateProfile(userId, {
        ...input,
        currentPassword: "MauvaisMotDePasse123!",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(repository.updateProfile).not.toHaveBeenCalled();
  });

  it("refuse une session dont l'utilisateur n'existe plus", async () => {
    repository.findPrivateById.mockResolvedValue(null);

    await expect(
      authService.updateProfile(userId, input),
    ).rejects.toBeInstanceOf(ProfileSessionInvalidError);

    expect(repository.updateProfile).not.toHaveBeenCalled();
  });

  it("convertit une erreur Prisma P2002 en conflit métier", async () => {
    repository.updateProfile.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Contrainte unique violée", {
        code: "P2002",
        clientVersion: "7.10.1",
      }),
    );

    await expect(
      authService.updateProfile(userId, input),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });

  it("convertit une erreur Prisma P2025 en session invalide", async () => {
    repository.updateProfile.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Utilisateur introuvable", {
        code: "P2025",
        clientVersion: "7.10.1",
      }),
    );

    await expect(
      authService.updateProfile(userId, input),
    ).rejects.toBeInstanceOf(ProfileSessionInvalidError);
  });

  it("propage une erreur technique inattendue", async () => {
    repository.updateProfile.mockRejectedValue(
      new Error("Database unavailable"),
    );

    await expect(authService.updateProfile(userId, input)).rejects.toThrow(
      "Database unavailable",
    );
  });
});
