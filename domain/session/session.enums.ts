export const SessionMode = {
    ON_SITE: "Présentiel",
    REMOTE: "Distanciel",
} as const;

export type SessionMode = (typeof SessionMode)[keyof typeof SessionMode];
