import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { Role } from "@domain/auth/user.enums";
import { absenceUseCases, studentUseCases } from "@express/src/container";

export const absenceRouter = Router();

absenceRouter.get(
    "/absences",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (_req, res) => {
        const result = await absenceUseCases.list();
        res.status(200).json(result.absences);
    },
);

absenceRouter.get(
    "/absences/student/:studentId",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await absenceUseCases.listByStudent(String(req.params.studentId));
        res.status(200).json(result.absences);
    },
);

absenceRouter.get("/absences/mine", requireAuth, async (req: AuthRequest, res) => {
    if (!req.auth) return void res.status(401).json({ error: "Unauthorized" });
    if (req.auth.role !== Role.STUDENT)
        return void res.status(403).json({ error: "Only students can access this endpoint" });
    const student = await studentUseCases.findByUserId(req.auth.userId);
    if (student.kind === "not_found") return void res.status(404).json({ error: "Student profile not found" });
    const result = await absenceUseCases.listByStudent(student.student.id);
    res.status(200).json(result.absences);
});

absenceRouter.get("/absences/:id", requireAuth, async (req, res) => {
    const result = await absenceUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Absence not found" });
    res.status(200).json(result.absence);
});

absenceRouter.post("/absences", requireAuth, async (req: AuthRequest, res) => {
    if (!req.auth) return void res.status(401).json({ error: "Unauthorized" });
    const result = await absenceUseCases.declare(req.body);
    if (result.kind === "missing_fields")
        return void res.status(400).json({ error: "studentId, sessionId and reason are required" });
    if (result.kind === "absence_already_exists")
        return void res.status(409).json({ error: "Absence already declared for this student and session" });
    res.status(201).json(result.absence);
});

absenceRouter.post(
    "/absences/:id/validate",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await absenceUseCases.validate(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Absence not found" });
        res.status(200).json(result.absence);
    },
);

absenceRouter.post(
    "/absences/:id/reject",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await absenceUseCases.reject(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Absence not found" });
        res.status(200).json(result.absence);
    },
);

absenceRouter.delete(
    "/absences/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await absenceUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Absence not found" });
        res.status(200).json({ message: "Absence deleted" });
    },
);

absenceRouter.get("/sessions/:sessionId/absences", requireAuth, requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR), async (req, res) => {
    const result = await absenceUseCases.listBySession(String(req.params.sessionId));
    res.status(200).json(result.absences);
});
