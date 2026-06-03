import { AdminRole } from "@domain/admin/admin.enums"

export const Role = {
  ...AdminRole,
  STUDENT: "Étudiant",
  INSTRUCTOR: "Enseignant",
} as const

export type Role = typeof Role[keyof typeof Role]
