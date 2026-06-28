import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { academicYearUseCases } from "@express/src/container";

export const academicYearRouter = Router();

academicYearRouter.get("/academic-years", requireAuth, async (_req, res) => {
    const result = await academicYearUseCases.list();
    res.status(200).json(result.academicYears);
});

academicYearRouter.get("/academic-years/current", requireAuth, async (_req, res) => {
    const result = await academicYearUseCases.getCurrent();
    if (result.kind === "not_found") return void res.status(404).json({ error: "No current academic year found" });
    res.status(200).json(result.academicYear);
});

academicYearRouter.get("/academic-years/:id", requireAuth, async (req, res) => {
    const result = await academicYearUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Academic year not found" });
    res.status(200).json(result.academicYear);
});

academicYearRouter.post(
    "/academic-years",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await academicYearUseCases.create(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "startDate and endDate are required" });
        res.status(201).json(result.academicYear);
    },
);

academicYearRouter.patch(
    "/academic-years/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await academicYearUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Academic year not found" });
        res.status(200).json(result.academicYear);
    },
);

academicYearRouter.delete(
    "/academic-years/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await academicYearUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Academic year not found" });
        res.status(200).json({ message: "Academic year deleted" });
    },
);

academicYearRouter.get("/academic-years/:id/periods", requireAuth, async (req, res) => {
    const { periodUseCases } = await import("@express/src/container");
    const result = await periodUseCases.listByAcademicYear(String(req.params.id));
    res.status(200).json(result.periods);
});
