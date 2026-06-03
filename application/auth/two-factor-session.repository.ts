import { type TwoFactorSession } from "@domain/auth/two-factor-session.entity";

export interface TwoFactorSessionRepository {
    create(userId: string): Promise<TwoFactorSession>;
    find(token: string, notBefore: Date): Promise<TwoFactorSession | undefined>;
    incrementAttempts(token: string): Promise<void>;
    delete(token: string): Promise<void>;
    deleteOlderThan(cutoff: Date): Promise<void>;
}
