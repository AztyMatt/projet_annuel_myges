import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { Role } from "@domain/auth/user.enums";
import { assessmentUseCases } from "@express/src/container";

export const assessmentRouter = Router();

assessmentRouter.get(
    "/assessments",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (_req, res) => {
        const result = await assessmentUseCases.list();
        res.status(200).json(result.assessments);
    },
);

assessmentRouter.get("/assessments/:id", requireAuth, async (req, res) => {
    const result = await assessmentUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Assessment not found" });
    res.status(200).json(result.assessment);
});

assessmentRouter.post(
    "/assessments",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await assessmentUseCases.create(req.body);
        if (result.kind === "missing_fields")
            return void res
                .status(400)
                .json({ error: "courseId, title, type, dueDate and maxGroupSize are required" });
        if (result.kind === "assessment_already_exists")
            return void res.status(409).json({ error: "An assessment with this title and due date already exists for this course" });
        res.status(201).json(result.assessment);
    },
);

assessmentRouter.patch(
    "/assessments/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await assessmentUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Assessment not found" });
        res.status(200).json(result.assessment);
    },
);

assessmentRouter.post(
    "/assessments/:id/publish",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await assessmentUseCases.publish(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Assessment not found" });
        res.status(200).json(result.assessment);
    },
);

assessmentRouter.delete(
    "/assessments/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await assessmentUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Assessment not found" });
        res.status(200).json({ message: "Assessment deleted" });
    },
);

assessmentRouter.get("/courses/:courseId/assessments", requireAuth, async (req, res) => {
    const result = await assessmentUseCases.listByCourse(String(req.params.courseId));
    res.status(200).json(result.assessments);
});

// assessment-group routes
assessmentRouter.get(
    "/assessment-groups/assessment/:assessmentId",
    requireAuth,
    async (req, res) => {
        const result = await assessmentUseCases.listGroupsByAssessment(String(req.params.assessmentId));
        res.status(200).json(result.assessmentGroups);
    },
);

assessmentRouter.get("/assessment-groups/:id", requireAuth, async (req, res) => {
    const result = await assessmentUseCases.findGroupById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "Assessment group not found" });
    res.status(200).json(result.assessmentGroup);
});

assessmentRouter.post("/assessment-groups", requireAuth, async (req, res) => {
    const result = await assessmentUseCases.createGroup(req.body);
    if (result.kind === "missing_fields")
        return void res.status(400).json({ error: "assessmentId is required" });
    res.status(201).json(result.assessmentGroup);
});

assessmentRouter.delete(
    "/assessment-groups/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await assessmentUseCases.deleteGroup(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Assessment group not found" });
        res.status(200).json({ message: "Assessment group deleted" });
    },
);

// assessment-group-member routes
assessmentRouter.get(
    "/assessment-group-members/group/:assessmentGroupId",
    requireAuth,
    async (req, res) => {
        const result = await assessmentUseCases.listGroupMembersByGroup(
            String(req.params.assessmentGroupId),
        );
        res.status(200).json(result.members);
    },
);

assessmentRouter.get(
    "/assessment-group-members/student/:studentId",
    requireAuth,
    async (req, res) => {
        const result = await assessmentUseCases.listGroupMembersByStudent(String(req.params.studentId));
        res.status(200).json(result.members);
    },
);

assessmentRouter.get("/assessment-group-members/:id", requireAuth, async (req, res) => {
    const result = await assessmentUseCases.findGroupMemberById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "Assessment group member not found" });
    res.status(200).json(result.member);
});

assessmentRouter.post("/assessment-group-members", requireAuth, async (req, res) => {
    const result = await assessmentUseCases.addGroupMember(req.body);
    if (result.kind === "missing_fields")
        return void res.status(400).json({ error: "assessmentGroupId and studentId are required" });
    if (result.kind === "member_already_exists")
        return void res.status(409).json({ error: "Student is already a member of this assessment group" });
    res.status(201).json(result.member);
});

assessmentRouter.delete(
    "/assessment-group-members/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await assessmentUseCases.deleteGroupMember(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Assessment group member not found" });
        res.status(200).json({ message: "Assessment group member deleted" });
    },
);
