import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
    resolve: {
        alias: {
            "@express": path.resolve(__dirname, "infrastructure/backend/express"),
            "@application": path.resolve(__dirname, "application"),
            "@domain": path.resolve(__dirname, "domain"),
        },
    },
    test: {
        globalSetup: ["./test/vitest.global-setup.ts"],
        setupFiles: ["./test/vitest.setup.ts"],
        include: ["**/*.test.ts"],
        exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
        testTimeout: 10000,
        // Les tests API (infrastructure/backend/express/test/api) partagent une seule base
        // Postgres réelle et la truncatent en beforeAll — les faire tourner en parallèle
        // ferait qu'un fichier vide la base pendant qu'un autre est encore en train d'y écrire.
        fileParallelism: false,
    },
});
