import { test, expect } from "@playwright/test";

test.describe("Abonnements E2E", () => {
  test("permet de s'abonner et de se désabonner d'un thème", async ({
    page,
  }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("Identifiants E2E manquants.");
    }

    // ARRANGE : connexion de l'utilisateur fictif.
    await page.goto("/login");

    await page.getByRole("textbox", { name: "Adresse e-mail" }).fill(email);

    await page.getByLabel("Mot de passe").fill(password);

    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/topics$/);

    const subscribeButton = page.getByRole("button", {
      name: "S'abonner à Node.js",
      exact: true,
    });

    const unsubscribeButton = page.getByRole("button", {
      name: "Se désabonner de Node.js",
      exact: true,
    });

    // Attend le chargement de l'état des abonnements.
    await expect(
      page.getByRole("button", {
        name: /^(S'abonner à|Se désabonner de) Node\.js$/,
      }),
    ).toBeEnabled();

    // Remet le thème dans son état initial si un
    // précédent test interrompu l'avait laissé abonné.
    if (await unsubscribeButton.isVisible()) {
      await unsubscribeButton.click();
      await expect(subscribeButton).toBeEnabled();
    }

    // ACT : abonnement réel.
    await subscribeButton.click();

    // ASSERT : état mis à jour après la réponse Express.
    await expect(unsubscribeButton).toBeEnabled();

    // Vérifie la persistance après rechargement.
    await page.reload();

    await expect(unsubscribeButton).toBeEnabled();

    // Vérifie que l'abonnement apparaît dans le profil.
    await page.goto("/profile");

    await expect(page.getByText("Node.js", { exact: true })).toBeVisible();

    // ACT : désabonnement réel.
    await page.goto("/topics");

    await expect(unsubscribeButton).toBeEnabled();
    await unsubscribeButton.click();

    // ASSERT : abonnement supprimé.
    await expect(subscribeButton).toBeEnabled();

    // Vérifie la persistance de la suppression.
    await page.reload();

    await expect(subscribeButton).toBeEnabled();
  });
});
