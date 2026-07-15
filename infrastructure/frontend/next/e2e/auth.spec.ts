import { test, expect } from "@playwright/test";
import { loginViaUi, expectLoggedInOn } from "./helpers/login-ui";
import { getSeedAdminCredentials } from "./helpers/api-setup";

test.describe("Connexion", () => {
    test("un mauvais mot de passe affiche une erreur et reste sur /login", async ({ page }) => {
        await loginViaUi(page, "admin.seed@myges.fr", "MauvaisMotDePasse1234$");

        await expect(page.getByText(/identifiants invalides/i)).toBeVisible();
        await expect(page).toHaveURL(/\/login$/);
    });

    test("des identifiants valides connectent et redirigent vers l'espace du rôle", async ({ page }) => {
        const { email, password } = await getSeedAdminCredentials();

        await loginViaUi(page, email, password);

        await expectLoggedInOn(page, "/scolarite");
    });
});
