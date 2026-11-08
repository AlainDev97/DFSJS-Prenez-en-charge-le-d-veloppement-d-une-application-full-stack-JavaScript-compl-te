import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import {
  loginLimiter,
  registerLimiter,
} from "../src/middleware/rate-limit.middleware.js";

describe("Rate limiting", () => {
  it("bloque après 10 échecs de connexion", async () => {
    const app = express();

    app.post("/login", loginLimiter, (_req, res) => {
      res.status(401).json({
        error: "Identifiants incorrects.",
      });
    });

    for (let i = 0; i < 10; i++) {
      await request(app).post("/login").expect(401);
    }

    const response = await request(app).post("/login").expect(429);

    expect(response.body.error).toContain("Trop de tentatives");
  });

  it("bloque après 5 demandes d'inscription", async () => {
    const app = express();

    app.post("/register", registerLimiter, (_req, res) => {
      res.status(400).json({
        error: "Données invalides.",
      });
    });

    for (let i = 0; i < 5; i++) {
      await request(app).post("/register").expect(400);
    }

    const response = await request(app).post("/register").expect(429);

    expect(response.body.error).toContain("Trop d'inscriptions");
  });
});
