import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./lib/prisma.js";

export const app = express();

// Sécurité HTTP
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "mdd-api",
  });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    const topicsCount = await prisma.topic.count();

    res.status(200).json({
      status: "ok",
      database: "connected",
      topicsCount,
    });
  } catch {
    res.status(503).json({
      status: "error",
      database: "unavailable",
    });
  }
});
