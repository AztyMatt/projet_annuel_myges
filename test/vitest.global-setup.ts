import path from "node:path";
import dotenv from "dotenv";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

/**
 * Runs once before the whole test run (not per worker) — creates the dedicated
 * test database if it doesn't exist yet, then applies every Drizzle migration to it.
 * Reuses the same Postgres instance as dev (docker-compose), never touches the dev DB.
 */
export default async function globalSetup(): Promise<void> {
    dotenv.config({ path: path.resolve(__dirname, "../.env.test.local") });

    const { DB_HOST, DB_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB } = process.env;
    if (!DB_HOST || !DB_PORT || !POSTGRES_USER || !POSTGRES_PASSWORD || !POSTGRES_DB) {
        throw new Error(
            "Variables Postgres manquantes pour les tests — vérifie .env.test.local (voir test/vitest.global-setup.ts)",
        );
    }

    const adminClient = new Client({
        host: DB_HOST,
        port: Number(DB_PORT),
        user: POSTGRES_USER,
        password: POSTGRES_PASSWORD,
        database: "postgres",
    });
    await adminClient.connect();
    try {
        await adminClient.query(`CREATE DATABASE "${POSTGRES_DB}"`);
    } catch (error) {
        // 42P04 = duplicate_database — la base de test existe déjà, on la réutilise
        if ((error as { code?: string }).code !== "42P04") throw error;
    } finally {
        await adminClient.end();
    }

    const { Pool } = await import("pg");
    const testPool = new Pool({
        host: DB_HOST,
        port: Number(DB_PORT),
        user: POSTGRES_USER,
        password: POSTGRES_PASSWORD,
        database: POSTGRES_DB,
    });
    await migrate(drizzle(testPool), {
        migrationsFolder: path.resolve(__dirname, "../infrastructure/backend/express/drizzle"),
    });
    await testPool.end();
}
