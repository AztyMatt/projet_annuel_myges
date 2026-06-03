export const SessionExamType = {
    WRITTEN: "Écrit",
    DEFENSE: "Soutenance",
} as const;

export type SessionExamType = (typeof SessionExamType)[keyof typeof SessionExamType];
