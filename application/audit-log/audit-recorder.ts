import { randomUUID } from "node:crypto";
import { type AuditLogValue } from "@domain/audit-log/audit-log.entity";
import { type AuditLogAction } from "@domain/audit-log/audit-log.enums";
import { type AuditLogRepository } from "@application/audit-log/audit-log.repository";

export type AuditRecordInput = {
    userId: string;
    action: AuditLogAction;
    entityName: string;
    entityId: string;
    oldValue?: AuditLogValue | null;
    newValue: AuditLogValue;
};

/**
 * Écriture du journal d'audit. Volontairement non bloquant : un échec d'écriture (ex. base
 * indisponible) est loggué côté serveur mais ne doit jamais faire échouer l'action métier qui
 * l'a déclenché (cf. CLAUDE.md AUD-002).
 */
export class AuditRecorder {
    constructor(private readonly auditLogs: AuditLogRepository) {}

    async record(entry: AuditRecordInput): Promise<void> {
        try {
            await this.auditLogs.save({
                id: randomUUID(),
                userId: entry.userId,
                action: entry.action,
                entityName: entry.entityName,
                entityId: entry.entityId,
                oldValue: entry.oldValue ?? null,
                newValue: entry.newValue,
                createdAt: new Date(),
            });
        } catch (err) {
            console.error("[audit-log] échec d'écriture", { ...entry }, err);
        }
    }
}
