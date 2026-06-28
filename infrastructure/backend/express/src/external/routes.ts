import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { externalUseCases } from "@express/src/container";

export const externalRouter = Router();

externalRouter.get("/externals", requireAuth, requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN), async (_req, res) => {
    const result = await externalUseCases.list();
    res.status(200).json(result.externals);
});

externalRouter.get("/externals/:id", requireAuth, requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN), async (req, res) => {
    const result = await externalUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "External not found" });
    res.status(200).json(result.external);
});

externalRouter.post(
    "/externals",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await externalUseCases.create(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "firstname, lastname, email and type are required" });
        if (result.kind === "email_already_exists")
            return void res.status(409).json({ error: "An external with this email already exists" });
        res.status(201).json(result.external);
    },
);

externalRouter.patch(
    "/externals/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await externalUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "External not found" });
        res.status(200).json(result.external);
    },
);

externalRouter.delete(
    "/externals/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await externalUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "External not found" });
        res.status(200).json({ message: "External deleted" });
    },
);
