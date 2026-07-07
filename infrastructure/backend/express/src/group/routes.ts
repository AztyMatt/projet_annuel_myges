import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { groupUseCases } from "@express/src/container";

export const groupRouter = Router();

groupRouter.get("/groups", requireAuth, async (_req, res) => {
    const result = await groupUseCases.list();
    res.status(200).json(result.groups);
});

groupRouter.get("/groups/:id", requireAuth, async (req, res) => {
    const result = await groupUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Group not found" });
    res.status(200).json(result.group);
});

groupRouter.post("/groups", requireAuth, requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN), async (req, res) => {
    const result = await groupUseCases.create(req.body);
    if (result.kind === "missing_fields")
        return void res.status(400).json({ error: "classId and name are required" });
    if (result.kind === "group_already_exists")
        return void res.status(409).json({ error: "A group with this name already exists in this class" });
    res.status(201).json(result.group);
});

groupRouter.patch(
    "/groups/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await groupUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Group not found" });
        res.status(200).json(result.group);
    },
);

groupRouter.delete(
    "/groups/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await groupUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Group not found" });
        res.status(200).json({ message: "Group deleted" });
    },
);

groupRouter.get("/groups/:id/students", requireAuth, async (req, res) => {
    const result = await groupUseCases.listStudentsByGroup(String(req.params.id));
    res.status(200).json(result.studentGroups);
});

groupRouter.post(
    "/groups/:id/students",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await groupUseCases.addStudent({ groupId: String(req.params.id), studentId: req.body.studentId });
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "studentId is required" });
        if (result.kind === "student_already_in_group")
            return void res.status(409).json({ error: "Student is already in this group" });
        res.status(201).json(result.studentGroup);
    },
);

groupRouter.delete(
    "/groups/:groupId/students/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await groupUseCases.removeStudent(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Student group not found" });
        res.status(200).json({ message: "Student removed from group" });
    },
);

groupRouter.get("/student-groups/student/:studentId", requireAuth, async (req, res) => {
    const result = await groupUseCases.listGroupsByStudent(String(req.params.studentId));
    res.status(200).json(result.studentGroups);
});

groupRouter.get("/student-groups/group/:groupId", requireAuth, async (req, res) => {
    const result = await groupUseCases.listStudentsByGroup(String(req.params.groupId));
    res.status(200).json(result.studentGroups);
});

groupRouter.post(
    "/student-groups",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await groupUseCases.addStudent(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "studentId and groupId are required" });
        if (result.kind === "student_already_in_group")
            return void res.status(409).json({ error: "Student is already in this group" });
        res.status(201).json(result.studentGroup);
    },
);

groupRouter.delete(
    "/student-groups/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await groupUseCases.removeStudent(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Student group not found" });
        res.status(200).json({ message: "Student group deleted" });
    },
);

groupRouter.get("/groups/:id/courses", requireAuth, async (req, res) => {
    const { courseUseCases } = await import("@express/src/container");
    const result = await courseUseCases.listByGroup(String(req.params.id));
    res.status(200).json(result.courses);
});
