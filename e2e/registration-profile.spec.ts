import { randomBytes, randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";

import { cleanupE2eUser } from "../scripts/cleanup-e2e-user.mjs";

test("inscription et modification du profil avec persistance", async ({
  page,
}) => {
  // ARRANGE : compte unique à chaque exécution.
  const suffix = randomBytes(6).toString("hex");

  const username = `e2e_${suffix}`;
  const updatedUsername = `e2e_${suffix}_updated`;

  const email = `e2e_${suffix}@example.test`;
  const updatedEmail = `e2e_${suffix}_updated@example.test`;

  const password = `TestA1!${randomUUID()}`;

  try {
    // 1. Inscription
    await page.goto("/register");

    await page
      .getByRole("textbox", { name: "Nom d'utilisateur" })
      .fill(username);

    await page.getByRole("textbox", { name: "Adresse e-mail" }).fill(email);

    await page.getByLabel("Mot de passe").fill(password);

    const registrationPromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/register") &&
        response.request().method() === "POST",
    );

    await page.getByRole("button", { name: "S'inscrire" }).click();

    const registrationResponse = await registrationPromise;

    expect(registrationResponse.status()).toBe(201);

    await expect(page.getByRole("status")).toContainText(
      "Compte créé avec succès",
    );

    // 2. Connexion
    await page.goto("/login");

    await page.getByRole("textbox", { name: "Adresse e-mail" }).fill(email);

    await page.getByLabel("Mot de passe").fill(password);

    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/topics$/);

    // 3. Modification du profil
    await page.goto("/profile");

    const usernameInput = page.getByRole("textbox", {
      name: "Nom d'utilisateur",
    });

    const emailInput = page.getByRole("textbox", {
      name: "Adresse email",
    });

    await expect(usernameInput).toHaveValue(username);
    await expect(emailInput).toHaveValue(email);

    await usernameInput.fill(updatedUsername);
    await emailInput.fill(updatedEmail);

    await page.getByLabel("Mot de passe actuel").fill(password);

    await page.getByRole("button", { name: "Sauvegarder" }).click();

    await expect(page.getByRole("status")).toContainText(
      "Profil enregistré avec succès.",
    );

    // 4. Persistance PostgreSQL
    await page.reload();

    await expect(usernameInput).toHaveValue(updatedUsername);
    await expect(emailInput).toHaveValue(updatedEmail);
  } finally {
    // Nettoyage même lorsqu'une assertion échoue.
    await cleanupE2eUser([email, updatedEmail]);
  }
});
