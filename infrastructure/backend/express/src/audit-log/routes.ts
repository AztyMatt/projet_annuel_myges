import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { type AuditLogAction } from "@domain/audit-log/audit-log.enums";
import { auditLogUseCases } from "@express/src/container";

export const auditLogRouter = Router();

auditLogRouter.get(
    "/audit-logs",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (_req, res) => {
        const result = await auditLogUseCases.list();
        res.status(200).json(result.auditLogs);
    },
);

auditLogRouter.get(
    "/audit-logs/user/:userId",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await auditLogUseCases.listByUser(String(req.params.userId));
        res.status(200).json(result.auditLogs);
    },
);

auditLogRouter.get(
    "/audit-logs/entity/:entityId",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await auditLogUseCases.listByEntity(String(req.params.entityId));
        res.status(200).json(result.auditLogs);
    },
);

auditLogRouter.get(
    "/audit-logs/action/:action",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await auditLogUseCases.listByAction(String(req.params.action) as AuditLogAction);
        res.status(200).json(result.auditLogs);
    },
);

auditLogRouter.get(
    "/audit-logs/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await auditLogUseCases.findById(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Audit log not found" });
        res.status(200).json(result.auditLog);
    },
);
