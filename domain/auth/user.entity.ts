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
    /** null = compte créé par invitation, le consentement est donné à l'activation (définition du mot de passe) */
    gdprConsentAt: Date | null;
    createdAt: Date;
    lastLoginAt: Date | null;
};
