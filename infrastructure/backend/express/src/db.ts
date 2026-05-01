import { Pool } from "pg"

export const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.POSTGRES_DB ?? "mygesdb",
  user: process.env.POSTGRES_USER ?? "mygesuser",
  password: process.env.POSTGRES_PASSWORD,
})

export const initDb = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                  TEXT PRIMARY KEY,
      email               TEXT UNIQUE NOT NULL,
      role                TEXT NOT NULL,
      password_hash       TEXT NOT NULL,
      failed_attempts     INTEGER NOT NULL DEFAULT 0,
      locked_until        TIMESTAMPTZ,
      password_updated_at TIMESTAMPTZ NOT NULL,
      two_factor_enabled  BOOLEAN NOT NULL DEFAULT false,
      two_factor_secret   TEXT,
      gdpr_consent_at     TIMESTAMPTZ NOT NULL,
      created_at          TIMESTAMPTZ NOT NULL,
      last_login_at       TIMESTAMPTZ
    )
  `)
}
