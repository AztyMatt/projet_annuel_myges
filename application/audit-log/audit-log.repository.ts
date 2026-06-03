import { type AuditLog } from "../../domain/audit-log/audit-log.entity"
import { type AuditLogAction } from "../../domain/audit-log/audit-log.enums"

export interface AuditLogRepository {
  findById(id: string): Promise<AuditLog | undefined>
  findByUserId(userId: string): Promise<AuditLog[]>
  findByEntityId(entityId: string): Promise<AuditLog[]>
  findByAction(action: AuditLogAction): Promise<AuditLog[]>
  save(auditLog: AuditLog): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<AuditLog[]>
}
