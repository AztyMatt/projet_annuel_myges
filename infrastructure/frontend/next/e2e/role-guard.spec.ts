import { test, expect } from "@playwright/test";
import { loginViaUi } from "./helpers/login-ui";
import { createProgramChain, createStudent, E2E_PASSWORD, loginAsSeedAdmin } from "./helpers/api-setup";

test.describe("Garde de route par rôle", () => {
    test("un étudiant connecté est redirigé hors de /scolarite (réservé admin/super admin)", async ({ page }) => {
        const suffix = `guard-${Date.now()}`;
        const adminToken = await loginAsSeedAdmin();
        const chain = await createProgramChain(adminToken, suffix);
        const { email } = await createStudent(adminToken, chain.programId, suffix);

        await loginViaUi(page, email, E2E_PASSWORD);
        await expect(page).toHaveURL(/\/etudiant$/);

        await page.goto("/scolarite");

        await expect(page).not.toHaveURL(/\/scolarite/);
        await expect(page).toHaveURL(/\/etudiant/);
    });

    test("un visiteur non connecté est redirigé vers /login en visitant une page protégée", async ({ page }) => {
        await page.context().clearCookies();
        await page.goto("/etudiant");
        await expect(page).toHaveURL(/\/login$/);
    });
});
