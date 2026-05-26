import { desc, eq } from "drizzle-orm"
import { type UserRepository } from "../../../../../../application/auth/user.repository"
import { type User } from "../../../../../../domain/auth/user.entity"
import { db } from "../db"
import { users } from "../schema/auth"

function rowToUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    failedAttempts: row.failedAttempts,
    lockedUntil: row.lockedUntil,
    passwordUpdatedAt: row.passwordUpdatedAt,
    twoFactorEnabled: row.twoFactorEnabled,
    twoFactorSecret: row.twoFactorSecret,
    gdprConsentAt: row.gdprConsentAt,
    createdAt: row.createdAt,
    lastLoginAt: row.lastLoginAt,
  }
}

export const userRepository: UserRepository = {
  async findByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1)
    return result[0] ? rowToUser(result[0]) : undefined
  },
  async findById(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return result[0] ? rowToUser(result[0]) : undefined
  },
  async save(user) {
    await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        failedAttempts: user.failedAttempts,
        lockedUntil: user.lockedUntil,
        passwordUpdatedAt: user.passwordUpdatedAt,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorSecret: user.twoFactorSecret,
        gdprConsentAt: user.gdprConsentAt,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          passwordHash: user.passwordHash,
          failedAttempts: user.failedAttempts,
          lockedUntil: user.lockedUntil,
          passwordUpdatedAt: user.passwordUpdatedAt,
          twoFactorEnabled: user.twoFactorEnabled,
          twoFactorSecret: user.twoFactorSecret,
          gdprConsentAt: user.gdprConsentAt,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
      })
  },
  async deleteById(id) {
    await db.delete(users).where(eq(users.id, id))
  },
  async list() {
    const result = await db.select().from(users).orderBy(desc(users.createdAt))
    return result.map(rowToUser)
  },
}
