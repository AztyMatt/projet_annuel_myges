// Double en mémoire pour AuditRecorder — utilisé par tous les use cases qui journalisent
// une action sensible (auth, notes, absences...). Contrairement aux repositories `notImplemented`,
// `save` fonctionne réellement : ces use cases appellent `record()` sur presque tous leurs
// chemins nominaux, un stub qui explose serait plus bruyant qu'utile.
import { type AuditLog } from "@domain/audit-log/audit-log.entity";
import { type AuditLogRepository } from "@application/audit-log/audit-log.repository";
import { AuditRecorder } from "@application/audit-log/audit-recorder";
import { notImplementedMethod } from "./not-implemented";

export function createFakeAuditRecorder() {
    const entries: AuditLog[] = [];
    const repo: AuditLogRepository = {
        findById: notImplementedMethod("AuditLogRepository", "findById"),
        findByUserId: notImplementedMethod("AuditLogRepository", "findByUserId"),
        async existsByUserId(userId) {
            return entries.some((e) => e.userId === userId);
        },
        findByEntityId: notImplementedMethod("AuditLogRepository", "findByEntityId"),
        findByAction: notImplementedMethod("AuditLogRepository", "findByAction"),
        async save(entry) {
            entries.push(entry);
        },
        deleteById: notImplementedMethod("AuditLogRepository", "deleteById"),
        async list() {
            return [...entries];
        },
    };
    return { auditRecorder: new AuditRecorder(repo), entries };
}
