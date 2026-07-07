import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { periodUseCases } from "@express/src/container";

export const periodRouter = Router();

periodRouter.get("/periods", requireAuth, async (_req, res) => {
    const result = await periodUseCases.list();
    res.status(200).json(result.periods);
});

periodRouter.get("/periods/:id", requireAuth, async (req, res) => {
    const result = await periodUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Period not found" });
    res.status(200).json(result.period);
});

periodRouter.post("/periods", requireAuth, requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN), async (req, res) => {
    const result = await periodUseCases.create(req.body);
    if (result.kind === "missing_fields")
        return void res.status(400).json({ error: "order, startDate, endDate and academicYearId are required" });
    if (result.kind === "period_order_already_exists")
        return void res.status(409).json({ error: "A period with this order already exists for this academic year" });
    res.status(201).json(result.period);
});

periodRouter.patch(
    "/periods/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await periodUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Period not found" });
        res.status(200).json(result.period);
    },
);

periodRouter.delete(
    "/periods/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await periodUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Period not found" });
        res.status(200).json({ message: "Period deleted" });
    },
);

periodRouter.get("/periods/:id/programs", requireAuth, async (req, res) => {
    const { programUseCases } = await import("@express/src/container");
    const result = await programUseCases.listByPeriod(String(req.params.id));
    res.status(200).json(result.programs);
});
