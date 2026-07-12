export const ExternalType = {
    INVIGILATOR: "INVIGILATOR",
    JURY: "JURY",
    OTHER: "OTHER",
} as const;

export type ExternalType = (typeof ExternalType)[keyof typeof ExternalType];
