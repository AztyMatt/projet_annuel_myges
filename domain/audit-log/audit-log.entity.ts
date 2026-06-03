import { type AuditLogAction } from "@domain/audit-log/audit-log.enums"

export type AuditLogValue = { [key: string]: string | number | boolean | null | AuditLogValue | AuditLogValue[] }

export type AuditLog = {
  id: string
  userId: string
  action: AuditLogAction
  entityName: string
  entityId: string
  oldValue: AuditLogValue | null
  newValue: AuditLogValue
  createdAt: Date
}
