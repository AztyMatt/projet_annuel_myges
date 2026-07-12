import { randomUUID } from "node:crypto";
import { and, eq, gte, lt } from "drizzle-orm";
import { type PasswordResetTokenRepository } from "@application/auth/password-reset-token.repository";
import { type PasswordResetToken } from "@domain/auth/password-reset-token.entity";
import { db } from "@express/src/postgres/db";
import { passwordResetTokens } from "@express/src/postgres/schema/auth";

function rowToToken(row: typeof passwordResetTokens.$inferSelect): PasswordResetToken {
    return {
        token: row.token,
        userId: row.userId,
        createdAt: row.createdAt,
    };
}

export const passwordResetTokenRepository: PasswordResetTokenRepository = {
    async create(userId) {
        const token: PasswordResetToken = {
            token: randomUUID(),
            userId,
            createdAt: new Date(),
        };
        await db.insert(passwordResetTokens).values(token);
        return token;
    },
    async find(token, notBefore) {
        const result = await db
            .select()
            .from(passwordResetTokens)
            .where(and(eq(passwordResetTokens.token, token), gte(passwordResetTokens.createdAt, notBefore)))
            .limit(1);
        return result[0] ? rowToToken(result[0]) : undefined;
    },
    async delete(token) {
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    },
    async deleteByUserId(userId) {
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    },
    async deleteOlderThan(cutoff) {
        await db.delete(passwordResetTokens).where(lt(passwordResetTokens.createdAt, cutoff));
    },
};
