import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";

import { cleanupE2eArticle } from "../scripts/cleanup-e2e-article.mjs";

test.describe("Articles et commentaires E2E", () => {
  test("publie un article et un commentaire avec persistance", async ({
    page,
  }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("Identifiants E2E manquants.");
    }

    const title = `E2E article ${randomUUID()}`;
    const content =
      "Cet article permet de vérifier la publication " +
      "et la persistance réelle dans PostgreSQL.";

    const comment = `Commentaire E2E ${randomUUID()}`;

    let createdArticleId: string | null = null;

    try {
      // ARRANGE : connexion réelle.
      await page.goto("/login");

      await page.getByRole("textbox", { name: "Adresse e-mail" }).fill(email);

      await page.getByLabel("Mot de passe").fill(password);

      await page.getByRole("button", { name: "Se connecter" }).click();

      await expect(page).toHaveURL(/\/topics$/);

      // ACT : création d'un article.
      await page.goto("/articles/new");

      await page
        .getByRole("combobox", { name: "Thème de l'article" })
        .selectOption({ label: "JavaScript" });

      await page
        .getByRole("textbox", { name: "Titre de l'article" })
        .fill(title);

      await page
        .getByRole("textbox", { name: "Contenu de l'article" })
        .fill(content);

      // Récupère l'identifiant réel créé par Express
      // pour pouvoir nettoyer l'article même en cas d'échec.
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/articles") &&
          response.request().method() === "POST",
      );

      await page.getByRole("button", { name: "Créer", exact: true }).click();

      const response = await responsePromise;

      if (response.status() === 201) {
        const payload = await response.json();
        createdArticleId = payload.data.id;
      }

      expect(response.status()).toBe(201);

      await expect(page).toHaveURL(/\/articles$/);

      // ASSERT : l'article apparaît dans la liste.
      const articleLink = page.getByRole("link").filter({
        has: page.getByRole("heading", {
          name: title,
          exact: true,
        }),
      });

      await expect(articleLink).toBeVisible();
      await articleLink.click();

      await expect(
        page.getByRole("heading", {
          name: title,
          exact: true,
        }),
      ).toBeVisible();

      await expect(page.getByText(content, { exact: true })).toBeVisible();

      // ACT : publication du commentaire.
      await page
        .getByRole("textbox", { name: "Votre commentaire" })
        .fill(comment);

      await page
        .getByRole("button", { name: "Envoyer le commentaire" })
        .click();

      // ASSERT : le commentaire apparaît.
      await expect(page.getByText(comment, { exact: true })).toBeVisible();

      // Vérifie que les données survivent au rechargement.
      await page.reload();

      await expect(
        page.getByRole("heading", {
          name: title,
          exact: true,
        }),
      ).toBeVisible();

      await expect(page.getByText(comment, { exact: true })).toBeVisible();
    } finally {
      // Nettoyage, même si une assertion échoue
      // après la création de l'article.
      if (createdArticleId) {
        await cleanupE2eArticle(createdArticleId, title);
      }
    }
  });
});
