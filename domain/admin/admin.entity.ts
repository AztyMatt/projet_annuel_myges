import { type AdminRole } from "@domain/admin/admin.enums"

export type Admin = {
  id: string
  userId: string
  instructorId: string | null
  role: AdminRole
}
