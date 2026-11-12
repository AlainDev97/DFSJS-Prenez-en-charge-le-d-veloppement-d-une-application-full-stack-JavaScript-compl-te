import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.e2e");

const result = loadEnv({
  path: envPath,
  quiet: true,
});

if (result.error) {
  throw new Error("Impossible de charger .env.e2e");
}

const requiredVariables = [
  "E2E_POSTGRES_PASSWORD",
  "E2E_EMAIL",
  "E2E_PASSWORD",
  "E2E_SESSION_SECRET",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Variable manquante : ${variable}`);
  }
}

if (process.env.E2E_EMAIL !== "alice@example.test") {
  throw new Error("Utilisez le compte fictif alice@example.test.");
}

if (process.env.E2E_PASSWORD.length < 12) {
  throw new Error("E2E_PASSWORD doit contenir au moins 12 caractères.");
}

if (Buffer.byteLength(process.env.E2E_SESSION_SECRET) < 32) {
  throw new Error("E2E_SESSION_SECRET doit contenir au moins 32 octets.");
}

// URL volontairement fixe pour empêcher
// toute connexion à la base de développement.
const databaseUrl = new URL(
  "postgresql://mdd_e2e@127.0.0.1:5434/mdd_e2e_db?schema=public",
);

databaseUrl.password = process.env.E2E_POSTGRES_PASSWORD;

export const e2eDatabaseUrl = databaseUrl.toString();
