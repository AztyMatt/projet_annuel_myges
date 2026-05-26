import { type AdminRole } from "./admin.enums"

export type Admin = {
  id: string
  userId: string
  instructorId: string | null
  role: AdminRole
}
