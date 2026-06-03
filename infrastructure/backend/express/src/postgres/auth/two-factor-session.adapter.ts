import { randomUUID } from "node:crypto"
import { and, eq, gte, lt, sql } from "drizzle-orm"
import { type TwoFactorSessionRepository } from "../../../../../../application/auth/two-factor-session.repository"
import { type TwoFactorSession } from "../../../../../../domain/auth/two-factor-session.entity"
import { db } from "../db"
import { twoFactorSessions } from "../schema/auth"

function rowToSession(row: typeof twoFactorSessions.$inferSelect): TwoFactorSession {
  return {
    token: row.token,
    userId: row.userId,
    attempts: row.attempts,
    createdAt: row.createdAt,
  }
}

export const twoFactorSessionRepository: TwoFactorSessionRepository = {
  async create(userId) {
    const session = {
      token: randomUUID(),
      userId,
      attempts: 0,
      createdAt: new Date(),
    }
    await db.insert(twoFactorSessions).values(session)
    return session
  },
  async find(token, notBefore) {
    const result = await db
      .select()
      .from(twoFactorSessions)
      .where(and(eq(twoFactorSessions.token, token), gte(twoFactorSessions.createdAt, notBefore)))
      .limit(1)
    return result[0] ? rowToSession(result[0]) : undefined
  },
  async incrementAttempts(token) {
    await db
      .update(twoFactorSessions)
      .set({ attempts: sql`${twoFactorSessions.attempts} + 1` })
      .where(eq(twoFactorSessions.token, token))
  },
  async delete(token) {
    await db.delete(twoFactorSessions).where(eq(twoFactorSessions.token, token))
  },
  async deleteOlderThan(cutoff) {
    await db.delete(twoFactorSessions).where(lt(twoFactorSessions.createdAt, cutoff))
  },
}
