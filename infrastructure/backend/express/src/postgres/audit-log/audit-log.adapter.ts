import { desc, eq } from "drizzle-orm"
import { type AuditLogRepository } from "@application/audit-log/audit-log.repository"
import { type AuditLog, type AuditLogValue } from "@domain/audit-log/audit-log.entity"
import { AuditLogAction } from "@domain/audit-log/audit-log.enums"
import { assertEnum } from "@express/src/postgres/assert-enum"
import { db } from "@express/src/postgres/db"
import { auditLog as auditLogTable } from "@express/src/postgres/schema/audit-log"

function rowToAuditLog(row: typeof auditLogTable.$inferSelect): AuditLog {
  return {
    id: row.id,
    userId: row.userId,
    action: assertEnum(row.action, AuditLogAction),
    entityName: row.entityName,
    entityId: row.entityId,
    oldValue: (row.oldValue as AuditLogValue) ?? null,
    newValue: row.newValue as AuditLogValue,
    createdAt: row.createdAt,
  }
}

export const auditLogRepository: AuditLogRepository = {
  async findById(id) {
    const result = await db.select().from(auditLogTable).where(eq(auditLogTable.id, id)).limit(1)
    return result[0] ? rowToAuditLog(result[0]) : undefined
  },
  async findByUserId(userId) {
    const result = await db.select().from(auditLogTable).where(eq(auditLogTable.userId, userId)).orderBy(desc(auditLogTable.createdAt))
    return result.map(rowToAuditLog)
  },
  async findByEntityId(entityId) {
    const result = await db.select().from(auditLogTable).where(eq(auditLogTable.entityId, entityId)).orderBy(desc(auditLogTable.createdAt))
    return result.map(rowToAuditLog)
  },
  async findByAction(action) {
    const result = await db.select().from(auditLogTable).where(eq(auditLogTable.action, action)).orderBy(desc(auditLogTable.createdAt))
    return result.map(rowToAuditLog)
  },
  async save(auditLogEntry) {
    await db
      .insert(auditLogTable)
      .values({
        id: auditLogEntry.id,
        userId: auditLogEntry.userId,
        action: auditLogEntry.action,
        entityName: auditLogEntry.entityName,
        entityId: auditLogEntry.entityId,
        oldValue: auditLogEntry.oldValue,
        newValue: auditLogEntry.newValue,
        createdAt: auditLogEntry.createdAt,
      })
      .onConflictDoUpdate({
        target: auditLogTable.id,
        set: {
          userId: auditLogEntry.userId,
          action: auditLogEntry.action,
          entityName: auditLogEntry.entityName,
          entityId: auditLogEntry.entityId,
          oldValue: auditLogEntry.oldValue,
          newValue: auditLogEntry.newValue,
          createdAt: auditLogEntry.createdAt,
        },
      })
  },
  async deleteById(id) {
    await db.delete(auditLogTable).where(eq(auditLogTable.id, id))
  },
  async list() {
    const result = await db.select().from(auditLogTable).orderBy(desc(auditLogTable.createdAt))
    return result.map(rowToAuditLog)
  },
}
