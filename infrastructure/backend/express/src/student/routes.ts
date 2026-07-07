import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { studentUseCases } from "@express/src/container";

export const studentRouter = Router();

studentRouter.get("/students", requireAuth, requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN), async (_req, res) => {
    const result = await studentUseCases.list();
    res.status(200).json(result.students);
});

studentRouter.get("/students/me", requireAuth, async (req: AuthRequest, res) => {
    if (!req.auth) return void res.status(401).json({ error: "Unauthorized" });
    const result = await studentUseCases.findByUserId(req.auth.userId);
    if (result.kind === "not_found") return void res.status(404).json({ error: "Student profile not found" });
    res.status(200).json(result.student);
});

studentRouter.get(
    "/students/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await studentUseCases.findById(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Student not found" });
        res.status(200).json(result.student);
    },
);

studentRouter.post(
    "/students",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await studentUseCases.create(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "userId and programId are required" });
        if (result.kind === "user_already_student")
            return void res.status(409).json({ error: "This user is already a student" });
        res.status(201).json(result.student);
    },
);

studentRouter.patch(
    "/students/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await studentUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Student not found" });
        res.status(200).json(result.student);
    },
);

studentRouter.delete(
    "/students/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await studentUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Student not found" });
        res.status(200).json({ message: "Student deleted" });
    },
);
