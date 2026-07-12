export const SessionExamType = {
    WRITTEN: "WRITTEN",
    DEFENSE: "DEFENSE",
} as const;

export type SessionExamType = (typeof SessionExamType)[keyof typeof SessionExamType];
