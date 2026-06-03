export const DocumentStatus = {
    PENDING: "En attente",
    VALID: "Validé",
    EXPIRED: "Expiré",
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];
