export const DocumentStatus = {
    PENDING: "PENDING",
    VALID: "VALID",
    EXPIRED: "EXPIRED",
    REJECTED: "REJECTED",
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];
