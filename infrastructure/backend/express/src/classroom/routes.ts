import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { classroomUseCases } from "@express/src/container";

export const classroomRouter = Router();

classroomRouter.get("/classrooms", requireAuth, async (_req, res) => {
    const result = await classroomUseCases.list();
    res.status(200).json(result.classrooms);
});

classroomRouter.get("/classrooms/:id", requireAuth, async (req, res) => {
    const result = await classroomUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Classroom not found" });
    res.status(200).json(result.classroom);
});

classroomRouter.post(
    "/classrooms",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await classroomUseCases.create(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "name, capacity and campusId are required" });
        res.status(201).json(result.classroom);
    },
);

classroomRouter.patch(
    "/classrooms/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await classroomUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Classroom not found" });
        res.status(200).json(result.classroom);
    },
);

classroomRouter.delete(
    "/classrooms/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await classroomUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Classroom not found" });
        res.status(200).json({ message: "Classroom deleted" });
    },
);
