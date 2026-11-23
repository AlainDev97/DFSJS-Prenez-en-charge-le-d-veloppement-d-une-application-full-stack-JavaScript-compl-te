import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { errorHandler } from "../src/middleware/error.middleware.js";

describe("Error middleware", () => {
  it("retourne une erreur 500 sans exposer les détails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const app = express();

      app.get("/test-error", async () => {
        throw new Error("Erreur technique confidentielle");
      });

      app.use(errorHandler);

      const response = await request(app).get("/test-error").expect(500);

      expect(response.body).toEqual({
        error: "Une erreur interne est survenue.",
      });

      expect(JSON.stringify(response.body)).not.toContain("confidentielle");
    } finally {
      log.mockRestore();
    }
  });

  it("conserve le statut 400 pour un JSON invalide", async () => {
    const app = express();

    app.use(express.json());

    app.post("/test", (_req, res) => {
      res.status(200).json({ success: true });
    });

    app.use(errorHandler);

    const response = await request(app)
      .post("/test")
      .set("Content-Type", "application/json")
      .send('{"invalid":')
      .expect(400);

    expect(response.body).toEqual({
      error: "Requête invalide.",
    });
  });
});
