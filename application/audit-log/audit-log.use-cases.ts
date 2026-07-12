import { type AuditLog, type AuditLogValue } from "@domain/audit-log/audit-log.entity";
import { type AuditLogAction } from "@domain/audit-log/audit-log.enums";
import { type AuditLogRepository } from "@application/audit-log/audit-log.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, Forbidden } from "@application/types/results";

export type AuditLogView = {
    id: string;
    userId: string;
    action: AuditLogAction;
    entityName: string;
    entityId: string;
    oldValue: AuditLogValue | null;
    newValue: AuditLogValue;
    createdAt: string;
};

export type ListAuditLogsResult = Forbidden | { kind: "audit_logs_listed"; auditLogs: AuditLogView[] };

export type GetAuditLogResult = NotFound | Forbidden | { kind: "audit_log_found"; auditLog: AuditLogView };

const toView = (a: AuditLog): AuditLogView => ({
    id: a.id,
    userId: a.userId,
    action: a.action,
    entityName: a.entityName,
    entityId: a.entityId,
    oldValue: a.oldValue,
    newValue: a.newValue,
    createdAt: a.createdAt.toISOString(),
});

export class AuditLogUseCases {
    constructor(private readonly auditLogs: AuditLogRepository) {}

    async list(auth: AuthContext): Promise<ListAuditLogsResult> {
        if (!auth.isAdmin) return Forbidden;
        const auditLogs = await this.auditLogs.list();
        return { kind: "audit_logs_listed", auditLogs: auditLogs.map(toView) };
    }

    async listByUser(userId: string, auth: AuthContext): Promise<ListAuditLogsResult> {
        if (!auth.isAdmin) return Forbidden;
        const auditLogs = await this.auditLogs.findByUserId(userId);
        return { kind: "audit_logs_listed", auditLogs: auditLogs.map(toView) };
    }

    async listByEntity(entityId: string, auth: AuthContext): Promise<ListAuditLogsResult> {
        if (!auth.isAdmin) return Forbidden;
        const auditLogs = await this.auditLogs.findByEntityId(entityId);
        return { kind: "audit_logs_listed", auditLogs: auditLogs.map(toView) };
    }

    async listByAction(action: AuditLogAction, auth: AuthContext): Promise<ListAuditLogsResult> {
        if (!auth.isAdmin) return Forbidden;
        const auditLogs = await this.auditLogs.findByAction(action);
        return { kind: "audit_logs_listed", auditLogs: auditLogs.map(toView) };
    }

    async findById(id: string, auth: AuthContext): Promise<GetAuditLogResult> {
        if (!auth.isAdmin) return Forbidden;
        const auditLog = await this.auditLogs.findById(id);
        if (!auditLog) return NotFound;
        return { kind: "audit_log_found", auditLog: toView(auditLog) };
    }
}
