export const DocumentStatus = {
    PENDING: "PENDING",
    VALID: "VALID",
    EXPIRED: "EXPIRED",
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];
