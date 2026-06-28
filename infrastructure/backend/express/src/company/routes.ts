import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { companyUseCases } from "@express/src/container";

export const companyRouter = Router();

companyRouter.get("/companies", requireAuth, async (_req, res) => {
    const result = await companyUseCases.list();
    res.status(200).json(result.companies);
});

companyRouter.get("/companies/:id", requireAuth, async (req, res) => {
    const result = await companyUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Company not found" });
    res.status(200).json(result.company);
});

companyRouter.post(
    "/companies",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await companyUseCases.create(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "name, siret, address and contactName are required" });
        if (result.kind === "siret_already_exists")
            return void res.status(409).json({ error: "A company with this SIRET already exists" });
        res.status(201).json(result.company);
    },
);

companyRouter.patch(
    "/companies/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await companyUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Company not found" });
        res.status(200).json(result.company);
    },
);

companyRouter.delete(
    "/companies/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await companyUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Company not found" });
        res.status(200).json({ message: "Company deleted" });
    },
);
