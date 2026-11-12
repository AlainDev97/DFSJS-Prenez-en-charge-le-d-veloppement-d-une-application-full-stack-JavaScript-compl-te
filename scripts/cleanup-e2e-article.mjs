import pg from "pg";
import { e2eDatabaseUrl } from "./e2e-env.mjs";

const { Client } = pg;

/**
 * Supprime exclusivement un article créé par un test E2E.
 * Les commentaires associés sont supprimés par cascade.
 */
export async function cleanupE2eArticle(articleId, title) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      articleId,
    ) ||
    !title.startsWith("E2E article ")
  ) {
    throw new Error("Nettoyage E2E refusé : données invalides.");
  }

  const client = new Client({
    connectionString: e2eDatabaseUrl,
  });

  await client.connect();

  try {
    const result = await client.query(
      `DELETE FROM "Post"
       WHERE "id" = $1::uuid AND "title" = $2
       RETURNING "id"`,
      [articleId, title],
    );

    if (result.rowCount !== 1) {
      throw new Error("Article E2E introuvable pour le nettoyage.");
    }

    console.log(`Article E2E nettoyé : ${articleId}`);
  } finally {
    await client.end();
  }
}
