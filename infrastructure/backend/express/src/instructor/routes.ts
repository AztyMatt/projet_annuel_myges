import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { instructorUseCases } from "@express/src/container";

export const instructorRouter = Router();

instructorRouter.get(
    "/instructors",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (_req, res) => {
        const result = await instructorUseCases.list();
        res.status(200).json(result.instructors);
    },
);

instructorRouter.get("/instructors/me", requireAuth, async (req: AuthRequest, res) => {
    if (!req.auth) return void res.status(401).json({ error: "Unauthorized" });
    const result = await instructorUseCases.findByUserId(req.auth.userId);
    if (result.kind === "not_found") return void res.status(404).json({ error: "Instructor profile not found" });
    res.status(200).json(result.instructor);
});

instructorRouter.get(
    "/instructors/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await instructorUseCases.findById(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Instructor not found" });
        res.status(200).json(result.instructor);
    },
);

instructorRouter.post(
    "/instructors",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await instructorUseCases.create(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "userId and contractType are required" });
        if (result.kind === "user_already_instructor")
            return void res.status(409).json({ error: "This user is already an instructor" });
        res.status(201).json(result.instructor);
    },
);

instructorRouter.patch(
    "/instructors/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await instructorUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Instructor not found" });
        res.status(200).json(result.instructor);
    },
);

instructorRouter.delete(
    "/instructors/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await instructorUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Instructor not found" });
        res.status(200).json({ message: "Instructor deleted" });
    },
);

instructorRouter.get(
    "/instructors/:id/courses",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const { courseUseCases } = await import("@express/src/container");
        const result = await courseUseCases.listByInstructor(String(req.params.id));
        res.status(200).json(result.courses);
    },
);
