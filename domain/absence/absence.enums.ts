export const BasicStatus = {
    PENDING: "En attente",
    VALIDATED: "Validé",
    REJECTED: "Rejeté",
} as const;

export type BasicStatus = (typeof BasicStatus)[keyof typeof BasicStatus];
