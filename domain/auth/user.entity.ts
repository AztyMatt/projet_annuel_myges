export type User = {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    passwordHash: string;
    failedAttempts: number;
    lockedUntil: Date | null;
    passwordUpdatedAt: Date;
    twoFactorEnabled: boolean;
    twoFactorSecret: string | null;
    gdprConsentAt: Date;
    createdAt: Date;
    lastLoginAt: Date | null;
};
