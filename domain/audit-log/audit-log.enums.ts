export const AuditLogAction = {
    CREATE: "CREATE",
    UPDATE: "UPDATE",
    DELETE: "DELETE",
    VALIDATE: "VALIDATE",
    REJECT: "REJECT",
    FREEZE: "FREEZE",
    LOGIN: "LOGIN",
    OTHER: "OTHER",
} as const;

export type AuditLogAction = (typeof AuditLogAction)[keyof typeof AuditLogAction];
