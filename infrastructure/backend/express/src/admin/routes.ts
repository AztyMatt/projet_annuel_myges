import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { adminUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";

const createAdminSchema = z.object({
    userId: z.string().min(1),
    role: z.enum(Object.values(AdminRole) as [string, ...string[]]),
});
const updateAdminSchema = patchBody({ role: z.enum(Object.values(AdminRole) as [string, ...string[]]).optional() });

export const adminRouter = Router();

adminRouter.get("/admins/me", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await adminUseCases.resolveOwnAdmin(auth);
    respond(res, result, {
        not_found: { status: 404, error: "Administrateur introuvable" },
        admin_found: (r) => ({ status: 200, body: r.admin }),
    });
}));

adminRouter.get("/admins", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await adminUseCases.list(auth);
    respond(res, result, {
        admins_listed: (r) => ({ status: 200, body: r.admins }),
    });
}));

adminRouter.get("/admins/user/:userId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await adminUseCases.findByUserId(String(req.params.userId), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Administrateur introuvable" },
        admin_found: (r) => ({ status: 200, body: r.admin }),
    });
}));

adminRouter.get("/admins/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await adminUseCases.findById(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Administrateur introuvable" },
        admin_found: (r) => ({ status: 200, body: r.admin }),
    });
}));

adminRouter.post("/admins", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await adminUseCases.create(req.body, auth);
    respond(res, result, {
        user_not_found: { status: 404, error: "Utilisateur introuvable" },
        user_already_admin: { blocked: { type: "Creation", reason: "Cet utilisateur est déjà administrateur" } },
        admin_created: (r) => ({ status: 201, body: r.admin }),
    });
}, createAdminSchema));

adminRouter.patch("/admins/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await adminUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Administrateur introuvable" },
        admin_updated: (r) => ({ status: 200, body: r.admin }),
    });
}, updateAdminSchema));

adminRouter.delete("/admins/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await adminUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Administrateur introuvable" },
        admin_deleted: { status: 200, body: { message: "Administrateur supprimé" } },
    });
}));
