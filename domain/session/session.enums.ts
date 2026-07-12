export const SessionMode = {
    ON_SITE: "ON_SITE",
    REMOTE: "REMOTE",
} as const;

export type SessionMode = (typeof SessionMode)[keyof typeof SessionMode];
