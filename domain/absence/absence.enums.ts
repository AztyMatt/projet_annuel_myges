export const BasicStatus = {
    PENDING: "PENDING",
    VALIDATED: "VALIDATED",
    REJECTED: "REJECTED",
} as const;

export type BasicStatus = (typeof BasicStatus)[keyof typeof BasicStatus];
