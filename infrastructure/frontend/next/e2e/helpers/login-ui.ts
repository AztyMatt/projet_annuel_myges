import { type Page, expect } from "@playwright/test";

/** Remplit et soumet le vrai formulaire /login (pas d'appel API direct) — le cookie httpOnly est posé par le navigateur lui-même. */
export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
    await page.goto("/login");
    await page.getByPlaceholder("votre@email.fr").fill(email);
    await page.getByPlaceholder("Votre mot de passe").fill(password);
    await page.getByRole("button", { name: "Se connecter" }).click();
}

export async function expectLoggedInOn(page: Page, path: string): Promise<void> {
    await expect(page).toHaveURL(new RegExp(`${path}$`), { timeout: 10_000 });
}
