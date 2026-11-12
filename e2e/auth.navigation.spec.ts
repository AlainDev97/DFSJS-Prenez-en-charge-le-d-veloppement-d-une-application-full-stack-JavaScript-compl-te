import { test, expect } from "@playwright/test";

test.describe("Parcours utilisateur MDD", () => {
  test("redirige un visiteur non connecté vers la connexion", async ({
    page,
  }) => {
    // Arrange / Act
    await page.goto("/topics");

    // Assert
    await expect(page).toHaveURL(/\/login$/);

    await expect(
      page.getByRole("heading", { name: "Connexion" }),
    ).toBeVisible();
  });

  test("permet de se connecter et de naviguer sur le MVP", async ({ page }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("Définissez E2E_EMAIL et E2E_PASSWORD avant les tests.");
    }

    // Connexion avec un compte fictif déjà présent en base.
    await page.goto("/login");

    await page.getByRole("textbox", { name: "Adresse e-mail" }).fill(email);

    await page.getByLabel("Mot de passe").fill(password);

    await page.getByRole("button", { name: "Se connecter" }).click();

    // Vérifie la redirection et les vrais thèmes PostgreSQL.
    await expect(page).toHaveURL(/\/topics$/);

    await expect(
      page.getByRole("heading", {
        name: "JavaScript",
        exact: true,
      }),
    ).toBeVisible();

    // Navigation vers les articles.
    await page.goto("/articles");

    await expect(
      page.getByRole("link", { name: "Créer un article" }),
    ).toBeVisible();

    // Navigation vers le profil avec la même session.
    await page.goto("/profile");

    await expect(
      page.getByRole("heading", {
        name: "Profil utilisateur",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("textbox", { name: "Adresse email" }),
    ).toHaveValue(email);
  });
});
