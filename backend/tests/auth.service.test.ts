import argon2 from "argon2";
import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  createUser: vi.fn(),
  findByEmail: vi.fn(),
  findPublicById: vi.fn(),
}));

vi.mock("../src/repositories/auth.repository.js", () => ({
  authRepository: repository,
}));

import {
  authService,
  InvalidCredentialsError,
} from "../src/services/auth.service.js";

const input = {
  email: "alice@example.test",
  username: "alice",
  password: "MotDePasseTest123!",
};

describe("AuthService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("hache le mot de passe avant de créer le compte", async () => {
    repository.createUser.mockResolvedValue({
      id: "user-id",
      email: input.email,
      username: input.username,
    });

    await authService.register(input);

    expect(repository.createUser).toHaveBeenCalledOnce();

    const data = repository.createUser.mock.calls[0][0];

    expect(data.passwordHash).not.toBe(input.password);
    expect(data.passwordHash).toMatch(/^\$argon2/);

    expect(await argon2.verify(data.passwordHash, input.password)).toBe(true);
  });

  it("authentifie un utilisateur avec le bon mot de passe", async () => {
    const passwordHash = await argon2.hash(input.password);

    repository.findByEmail.mockResolvedValue({
      id: "user-id",
      email: input.email,
      username: input.username,
      passwordHash,
    });

    const user = await authService.login({
      email: input.email,
      password: input.password,
    });

    expect(user.username).toBe("alice");
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("rejette un mot de passe incorrect", async () => {
    const passwordHash = await argon2.hash(input.password);

    repository.findByEmail.mockResolvedValue({
      id: "user-id",
      email: input.email,
      username: input.username,
      passwordHash,
    });

    await expect(
      authService.login({
        email: input.email,
        password: "MauvaisMotDePasse123!",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
