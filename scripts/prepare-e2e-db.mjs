import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { e2eDatabaseUrl } from "./e2e-env.mjs";

const backendDirectory = resolve(process.cwd(), "backend");

const environment = {
  ...process.env,
  DATABASE_URL: e2eDatabaseUrl,
  SEED_PASSWORD: process.env.E2E_PASSWORD,
  NODE_ENV: "test",
};

const commands = [
  {
    label: "Application des migrations E2E",
    args: ["exec", "--", "prisma", "migrate", "deploy"],
  },
  {
    label: "Génération du client Prisma",
    args: ["exec", "--", "prisma", "generate"],
  },
  {
    label: "Insertion des données fictives",
    args: ["run", "db:seed"],
  },
];

for (const command of commands) {
  console.log(`\n${command.label}`);

  const result = spawnSync("npm", command.args, {
    cwd: backendDirectory,
    env: environment,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\nBase PostgreSQL E2E prête.");
