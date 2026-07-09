import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { adminUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";

export const adminRouter = Router();

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
        not_found: { status: 404, error: "Admin not found" },
        admin_found: (r) => ({ status: 200, body: r.admin }),
    });
}));

adminRouter.get("/admins/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await adminUseCases.findById(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Admin not found" },
        admin_found: (r) => ({ status: 200, body: r.admin }),
    });
}));

adminRouter.post("/admins", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await adminUseCases.create(req.body, auth);
    respond(res, result, {
        missing_fields: { status: 400, error: "userId and role are required" },
        user_already_admin: { blocked: { type: "Creation", reason: "This user is already an admin" } },
        admin_created: (r) => ({ status: 201, body: r.admin }),
    });
}));

adminRouter.patch("/admins/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await adminUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Admin not found" },
        admin_updated: (r) => ({ status: 200, body: r.admin }),
    });
}));

adminRouter.delete("/admins/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await adminUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Admin not found" },
        admin_deleted: { status: 200, body: { message: "Admin deleted" } },
    });
}));
