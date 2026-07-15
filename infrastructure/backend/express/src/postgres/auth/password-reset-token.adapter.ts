import { randomUUID } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import { type PasswordResetTokenRepository } from "@application/auth/password-reset-token.repository";
import { type PasswordResetToken, type PasswordResetTokenPurpose } from "@domain/auth/password-reset-token.entity";
import { db } from "@express/src/postgres/db";
import { passwordResetTokens } from "@express/src/postgres/schema/auth";

function rowToToken(row: typeof passwordResetTokens.$inferSelect): PasswordResetToken {
    return {
        token: row.token,
        userId: row.userId,
        purpose: row.purpose as PasswordResetTokenPurpose,
        createdAt: row.createdAt,
    };
}

export const passwordResetTokenRepository: PasswordResetTokenRepository = {
    async create(userId, purpose) {
        const token: PasswordResetToken = {
            token: randomUUID(),
            userId,
            purpose,
            createdAt: new Date(),
        };
        await db.insert(passwordResetTokens).values(token);
        return token;
    },
    async find(token) {
        const result = await db
            .select()
            .from(passwordResetTokens)
            .where(eq(passwordResetTokens.token, token))
            .limit(1);
        return result[0] ? rowToToken(result[0]) : undefined;
    },
    async delete(token) {
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    },
    async deleteByUserId(userId) {
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    },
    async deleteOlderThan(cutoff, purpose) {
        await db
            .delete(passwordResetTokens)
            .where(and(lt(passwordResetTokens.createdAt, cutoff), eq(passwordResetTokens.purpose, purpose)));
    },
};
