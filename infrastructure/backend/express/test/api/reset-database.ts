import { pool } from "@express/src/postgres/db";

/**
 * Vide toutes les tables métier de la base de test (schéma public) avant une suite de tests API.
 * Interroge Postgres pour la liste des tables plutôt que de la coder en dur : reste valable
 * sans maintenance si de nouvelles tables sont ajoutées au schéma Drizzle.
 */
export async function resetTestDatabase(): Promise<void> {
    const { rows } = await pool.query<{ tablename: string }>(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    );
    if (rows.length === 0) return;
    const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
    await pool.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}
