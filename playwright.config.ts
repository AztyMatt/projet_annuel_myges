import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// SEED_PASSWORD (compte admin.seed@myges.fr créé au démarrage du backend, cf. docker-compose)
// vient du .env de dev à la racine — Playwright ne le charge pas tout seul.
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Suppose que la stack dev tourne déjà (docker compose up -d) — même prérequis que les tests
// API Vitest pour Postgres. Playwright ne démarre pas les serveurs lui-même : ce projet a déjà
// docker-compose pour orchestrer frontend + backend + Postgres ensemble, pas la peine de le
// réimplémenter via webServer.
export default defineConfig({
    testDir: "./infrastructure/frontend/next/e2e",
    fullyParallel: false,
    // Tous les specs partagent la même base de dev via l'API réelle (pas de base isolée comme
    // pour les tests Vitest) — un seul worker évite les collisions entre fichiers exécutés en
    // parallèle sur des ressources qui pourraient se recouper.
    workers: 1,
    retries: 0,
    reporter: [["list"]],
    use: {
        baseURL: "http://localhost:3000",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
