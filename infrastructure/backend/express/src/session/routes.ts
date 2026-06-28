import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { Role } from "@domain/auth/user.enums";
import { sessionUseCases } from "@express/src/container";

export const sessionRouter = Router();

sessionRouter.get(
    "/sessions",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (_req, res) => {
        const result = await sessionUseCases.list();
        res.status(200).json(result.sessions);
    },
);

sessionRouter.get("/sessions/:id", requireAuth, async (req, res) => {
    const result = await sessionUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Session not found" });
    res.status(200).json(result.session);
});

sessionRouter.post(
    "/sessions",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await sessionUseCases.create(req.body);
        if (result.kind === "missing_fields")
            return void res
                .status(400)
                .json({ error: "courseId, startTime, endTime, mode and classroomId are required" });
        if (result.kind === "classroom_conflict")
            return void res.status(409).json({ error: "Classroom is already booked for this time slot" });
        res.status(201).json(result.session);
    },
);

sessionRouter.patch(
    "/sessions/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await sessionUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Session not found" });
        if (result.kind === "classroom_conflict")
            return void res.status(409).json({ error: "Classroom is already booked for this time slot" });
        res.status(200).json(result.session);
    },
);

sessionRouter.delete(
    "/sessions/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await sessionUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Session not found" });
        res.status(200).json({ message: "Session deleted" });
    },
);

sessionRouter.get("/courses/:courseId/sessions", requireAuth, async (req, res) => {
    const result = await sessionUseCases.listByCourse(String(req.params.courseId));
    res.status(200).json(result.sessions);
});

sessionRouter.get("/classrooms/:classroomId/sessions", requireAuth, async (req, res) => {
    const result = await sessionUseCases.listByClassroom(String(req.params.classroomId));
    res.status(200).json(result.sessions);
});
