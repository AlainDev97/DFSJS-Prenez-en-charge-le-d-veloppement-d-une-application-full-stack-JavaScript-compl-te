import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../src/generated/prisma/client.js";

const repository = vi.hoisted(() => ({
  findByUser: vi.fn(),
  findTopic: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("../src/repositories/subscriptions.repository.js", () => ({
  subscriptionsRepository: repository,
}));

import {
  subscriptionsService,
  AlreadySubscribedError,
  TopicNotFoundError,
} from "../src/services/subscriptions.service.js";

const userId = "123e4567-e89b-42d3-a456-426614174000";
const topicId = "223e4567-e89b-42d3-a456-426614174000";

describe("SubscriptionsService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("récupère les abonnements de l'utilisateur", async () => {
    repository.findByUser.mockResolvedValue([{ topicId }]);

    const result = await subscriptionsService.getByUser(userId);

    expect(result).toEqual([{ topicId }]);
    expect(repository.findByUser).toHaveBeenCalledWith(userId);
  });

  it("crée un abonnement pour un thème existant", async () => {
    repository.findTopic.mockResolvedValue({ id: topicId });
    repository.create.mockResolvedValue({ topicId });

    const result = await subscriptionsService.subscribe(userId, topicId);

    expect(result).toEqual({ topicId });

    expect(repository.create).toHaveBeenCalledWith(userId, topicId);
  });

  it("rejette un abonnement vers un thème inexistant", async () => {
    repository.findTopic.mockResolvedValue(null);

    await expect(
      subscriptionsService.subscribe(userId, topicId),
    ).rejects.toBeInstanceOf(TopicNotFoundError);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it("transforme une contrainte unique Prisma en erreur métier", async () => {
    repository.findTopic.mockResolvedValue({ id: topicId });

    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Contrainte unique violée", {
        code: "P2002",
        clientVersion: "7.10.1",
      }),
    );

    await expect(
      subscriptionsService.subscribe(userId, topicId),
    ).rejects.toBeInstanceOf(AlreadySubscribedError);
  });

  it("permet un désabonnement idempotent", async () => {
    repository.remove.mockResolvedValue({ count: 0 });

    await expect(
      subscriptionsService.unsubscribe(userId, topicId),
    ).resolves.toBeUndefined();

    expect(repository.remove).toHaveBeenCalledWith(userId, topicId);
  });
});
