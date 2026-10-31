import express from "express";
import cors from "cors";
import helmet from "helmet";

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
