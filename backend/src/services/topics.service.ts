import { topicsRepository } from "../repositories/topics.repository.js";

export const topicsService = {
  getAll(search?: string) {
    return topicsRepository.findAll(search);
  },
};
