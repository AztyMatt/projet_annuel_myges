import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { campusUseCases } from "@express/src/container";

export const campusRouter = Router();

campusRouter.get("/campuses", requireAuth, async (_req, res) => {
    const result = await campusUseCases.list();
    res.status(200).json(result.campuses);
});

campusRouter.get("/campuses/:id", requireAuth, async (req, res) => {
    const result = await campusUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Campus not found" });
    res.status(200).json(result.campus);
});

campusRouter.post("/campuses", requireAuth, requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN), async (req, res) => {
    const result = await campusUseCases.create(req.body);
    if (result.kind === "missing_fields") return void res.status(400).json({ error: "name and address are required" });
    if (result.kind === "campus_already_exists")
        return void res.status(409).json({ error: "A campus with this name already exists" });
    res.status(201).json(result.campus);
});

campusRouter.patch(
    "/campuses/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await campusUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Campus not found" });
        res.status(200).json(result.campus);
    },
);

campusRouter.delete(
    "/campuses/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await campusUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Campus not found" });
        res.status(200).json({ message: "Campus deleted" });
    },
);

campusRouter.get("/campuses/:id/classrooms", requireAuth, async (req, res) => {
    const { classroomUseCases } = await import("@express/src/container");
    const result = await classroomUseCases.listByCampus(String(req.params.id));
    res.status(200).json(result.classrooms);
});
