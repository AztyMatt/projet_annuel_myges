import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { moduleUseCases } from "@express/src/container";

export const moduleRouter = Router();

moduleRouter.get("/modules", requireAuth, async (_req, res) => {
    const result = await moduleUseCases.list();
    res.status(200).json(result.modules);
});

moduleRouter.get("/modules/:id", requireAuth, async (req, res) => {
    const result = await moduleUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Module not found" });
    res.status(200).json(result.module);
});

moduleRouter.post("/modules", requireAuth, requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN), async (req, res) => {
    const result = await moduleUseCases.create(req.body);
    if (result.kind === "missing_fields")
        return void res.status(400).json({ error: "name, coefficient and ectsCredits are required" });
    res.status(201).json(result.module);
});

moduleRouter.patch(
    "/modules/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await moduleUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Module not found" });
        res.status(200).json(result.module);
    },
);

moduleRouter.delete(
    "/modules/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await moduleUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Module not found" });
        res.status(200).json({ message: "Module deleted" });
    },
);

moduleRouter.get("/modules/:id/courses", requireAuth, async (req, res) => {
    const { courseUseCases } = await import("@express/src/container");
    const result = await courseUseCases.listByModule(String(req.params.id));
    res.status(200).json(result.courses);
});
