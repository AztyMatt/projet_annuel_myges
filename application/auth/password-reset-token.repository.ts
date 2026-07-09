import { type PasswordResetToken } from "@domain/auth/password-reset-token.entity";

export interface PasswordResetTokenRepository {
    create(userId: string): Promise<PasswordResetToken>;
    find(token: string, notBefore: Date): Promise<PasswordResetToken | undefined>;
    delete(token: string): Promise<void>;
    deleteByUserId(userId: string): Promise<void>;
    deleteOlderThan(cutoff: Date): Promise<void>;
}
