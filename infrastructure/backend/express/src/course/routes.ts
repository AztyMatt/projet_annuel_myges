import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { Role } from "@domain/auth/user.enums";
import { courseUseCases, instructorUseCases } from "@express/src/container";

export const courseRouter = Router();

courseRouter.get("/courses", requireAuth, requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN), async (_req, res) => {
    const result = await courseUseCases.list();
    res.status(200).json(result.courses);
});

courseRouter.get("/courses/mine", requireAuth, async (req: AuthRequest, res) => {
    if (!req.auth) return void res.status(401).json({ error: "Unauthorized" });
    if (req.auth.role !== Role.INSTRUCTOR)
        return void res.status(403).json({ error: "Only instructors can access this endpoint" });
    const instructor = await instructorUseCases.findByUserId(req.auth.userId);
    if (instructor.kind === "not_found") return void res.status(404).json({ error: "Instructor profile not found" });
    const result = await courseUseCases.listByInstructor(instructor.instructor.id);
    res.status(200).json(result.courses);
});

courseRouter.get("/courses/:id", requireAuth, async (req, res) => {
    const result = await courseUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Course not found" });
    res.status(200).json(result.course);
});

courseRouter.post(
    "/courses",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await courseUseCases.create(req.body);
        if (result.kind === "missing_fields")
            return void res
                .status(400)
                .json({ error: "instructorId, moduleId, classId, blocId and conversationId are required" });
        res.status(201).json(result.course);
    },
);

courseRouter.patch(
    "/courses/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await courseUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Course not found" });
        res.status(200).json(result.course);
    },
);

courseRouter.delete(
    "/courses/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await courseUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Course not found" });
        res.status(200).json({ message: "Course deleted" });
    },
);
