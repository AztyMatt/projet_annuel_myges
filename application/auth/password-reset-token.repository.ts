import { type PasswordResetToken, type PasswordResetTokenPurpose } from "@domain/auth/password-reset-token.entity";

export interface PasswordResetTokenRepository {
    create(userId: string, purpose: PasswordResetTokenPurpose): Promise<PasswordResetToken>;
    find(token: string): Promise<PasswordResetToken | undefined>;
    delete(token: string): Promise<void>;
    deleteByUserId(userId: string): Promise<void>;
    deleteOlderThan(cutoff: Date, purpose: PasswordResetTokenPurpose): Promise<void>;
}
