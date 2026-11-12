import pg from "pg";
import { e2eDatabaseUrl } from "./e2e-env.mjs";

const { Client } = pg;

/**
 * Supprime uniquement un compte fictif E2E.
 * Les données associées sont supprimées par cascade.
 */
export async function cleanupE2eUser(emails) {
  const allowedEmail = /^e2e_[0-9a-f]{12}(?:_updated)?@example\.test$/;

  if (
    !Array.isArray(emails) ||
    emails.length !== 2 ||
    !emails.every(
      (email) => typeof email === "string" && allowedEmail.test(email),
    )
  ) {
    throw new Error("Nettoyage utilisateur E2E refusé.");
  }

  const url = new URL(e2eDatabaseUrl);

  if (
    url.hostname !== "127.0.0.1" ||
    url.port !== "5434" ||
    url.pathname !== "/mdd_e2e_db"
  ) {
    throw new Error("Base E2E inattendue.");
  }

  const client = new Client({
    connectionString: e2eDatabaseUrl,
  });

  await client.connect();

  try {
    const result = await client.query(
      `DELETE FROM "User"
       WHERE "email" = ANY($1::text[])
         AND "username" LIKE 'e2e_%'
       RETURNING "id"`,
      [emails],
    );

    if (result.rowCount > 1) {
      throw new Error("Plusieurs utilisateurs supprimés : vérifiez les tests.");
    }

    console.log(`Nettoyage E2E : ${result.rowCount} utilisateur(s).`);
  } finally {
    await client.end();
  }
}
