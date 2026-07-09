import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { type AuditLogAction } from "@domain/audit-log/audit-log.enums";
import { auditLogUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";

export const auditLogRouter = Router();

auditLogRouter.get("/audit-logs", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await auditLogUseCases.list(auth);
    respond(res, result, {
        audit_logs_listed: (r) => ({ status: 200, body: r.auditLogs }),
    });
}));

auditLogRouter.get("/audit-logs/user/:userId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await auditLogUseCases.listByUser(String(req.params.userId), auth);
    respond(res, result, {
        audit_logs_listed: (r) => ({ status: 200, body: r.auditLogs }),
    });
}));

auditLogRouter.get("/audit-logs/entity/:entityId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await auditLogUseCases.listByEntity(String(req.params.entityId), auth);
    respond(res, result, {
        audit_logs_listed: (r) => ({ status: 200, body: r.auditLogs }),
    });
}));

auditLogRouter.get("/audit-logs/action/:action", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await auditLogUseCases.listByAction(String(req.params.action) as AuditLogAction, auth);
    respond(res, result, {
        audit_logs_listed: (r) => ({ status: 200, body: r.auditLogs }),
    });
}));

auditLogRouter.get("/audit-logs/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await auditLogUseCases.findById(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Audit log not found" },
        audit_log_found: (r) => ({ status: 200, body: r.auditLog }),
    });
}));

auditLogRouter.delete("/audit-logs", ...authed((_req, res) => {
    send(res, { status: 405, error: "Audit logs cannot be deleted" });
}));

auditLogRouter.delete("/audit-logs/:id", ...authed((_req, res) => {
    send(res, { status: 405, error: "Audit logs cannot be deleted" });
}));
