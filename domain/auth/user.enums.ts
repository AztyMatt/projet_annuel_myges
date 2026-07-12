import { AdminRole } from "@domain/admin/admin.enums";

export const Role = {
    ...AdminRole,
    STUDENT: "STUDENT",
    INSTRUCTOR: "INSTRUCTOR",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
