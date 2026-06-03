export const AdminRole = {
    SUPER_ADMIN: "Super Administrateur",
    ADMIN: "Administrateur",
} as const;

export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];
