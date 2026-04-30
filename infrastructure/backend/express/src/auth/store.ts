import { type DevSeedAccount, type Role, type User } from "./types"

export const usersByEmail = new Map<string, User>()
export const usersById = new Map<string, User>()
export const devSeedAccounts: DevSeedAccount[] = []

export const rolePermissions: Record<Role, string[]> = {
  student: ["grades:read:self", "profile:read:self"],
  teacher: ["courses:read", "grades:write"],
  admin: ["users:read", "users:update", "reports:read"],
  super_admin: ["*"],
}
