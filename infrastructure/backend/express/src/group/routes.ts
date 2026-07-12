import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { groupUseCases } from "@express/src/container";
import { send, respond } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";

const createGroupSchema = z.object({ classId: z.string().min(1), name: z.string().min(1) });
const updateGroupSchema = patchBody({ classId: z.string().min(1).optional(), name: z.string().min(1).optional() });
const addStudentByGroupSchema = z.object({ studentId: z.string().min(1) });
const addStudentGroupSchema = z.object({ studentId: z.string().min(1), groupId: z.string().min(1) });

export const groupRouter = Router();

groupRouter.get("/groups", ...authed(async (_req, res) => {
    const result = await groupUseCases.list();
    send(res, { status: 200, body: result.groups });
}));

groupRouter.get("/groups/:id", ...authed(async (req, res) => {
    const result = await groupUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Group not found" },
        group_found: (r) => ({ status: 200, body: r.group }),
    });
}));

groupRouter.post("/groups", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await groupUseCases.create(req.body, auth);
    respond(res, result, {
        class_not_found: { status: 404, error: "Class not found" },
        group_name_general_reserved: { blocked: { type: "Creation", reason: "\"General\" is a reserved name (the base group is created automatically with the class)" } },
        group_already_exists: { blocked: { type: "Creation", reason: "A group with this name already exists in this class" } },
        group_created: (r) => ({ status: 201, body: r.group }),
    });
}, createGroupSchema));

groupRouter.patch("/groups/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await groupUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Group not found" },
        class_not_found: { status: 404, error: "Class not found" },
        general_group_cannot_be_renamed: { blocked: { type: "Operation", reason: "The General group cannot be renamed (it is the class base group)" } },
        group_name_general_reserved: { blocked: { type: "Operation", reason: "\"General\" is a reserved name and cannot be assigned to another group" } },
        general_group_cannot_be_moved: { blocked: { type: "Operation", reason: "The General group cannot be moved to another class" } },
        group_already_exists: { blocked: { type: "Operation", reason: "A group with this name already exists in this class" } },
        group_has_incompatible_courses: { blocked: { type: "Operation", reason: "The group's courses are incompatible with the target class program (move or delete them first)" } },
        group_updated: (r) => ({ status: 200, body: r.group }),
    });
}, updateGroupSchema));

groupRouter.delete("/groups/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await groupUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Group not found" },
        general_group_cannot_be_deleted: { blocked: { type: "Operation", reason: "Cannot delete the General group (delete the class instead)" } },
        group_has_students: { blocked: { type: "Deletion", reason: "Group has students" } },
        group_has_courses: { blocked: { type: "Deletion", reason: "Group has courses" } },
        group_deleted: { status: 200, body: { message: "Group deleted" } },
    });
}));

groupRouter.get("/groups/:id/students", ...authed(async (req, res) => {
    const result = await groupUseCases.listStudentsByGroup(String(req.params.id));
    send(res, { status: 200, body: result.studentGroups });
}));

groupRouter.post("/groups/:id/students", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await groupUseCases.addStudent({ groupId: String(req.params.id), studentId: req.body.studentId }, auth);
    respond(res, result, {
        group_not_found: { status: 404, error: "Group not found" },
        student_not_found: { status: 404, error: "Student not found" },
        student_already_in_group: { blocked: { type: "Creation", reason: "This student is already in this group" } },
        student_group_created: (r) => ({ status: 201, body: r.studentGroup }),
    });
}, addStudentByGroupSchema));

groupRouter.get("/student-groups/student/:studentId", ...authed(async (req, res) => {
    const result = await groupUseCases.listGroupsByStudent(String(req.params.studentId));
    send(res, { status: 200, body: result.studentGroups });
}));

groupRouter.get("/student-groups/group/:groupId", ...authed(async (req, res) => {
    const result = await groupUseCases.listStudentsByGroup(String(req.params.groupId));
    send(res, { status: 200, body: result.studentGroups });
}));

groupRouter.post("/student-groups", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await groupUseCases.addStudent(req.body, auth);
    respond(res, result, {
        group_not_found: { status: 404, error: "Group not found" },
        student_not_found: { status: 404, error: "Student not found" },
        student_already_in_group: { blocked: { type: "Creation", reason: "This student is already in this group" } },
        student_group_created: (r) => ({ status: 201, body: r.studentGroup }),
    });
}, addStudentGroupSchema));

groupRouter.delete("/student-groups/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await groupUseCases.removeStudent(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Student group not found" },
        student_group_deleted: { status: 200, body: { message: "Student group deleted" } },
    });
}));

groupRouter.get("/groups/:id/courses", ...authed(async (req, res) => {
    const { courseUseCases } = await import("@express/src/container");
    const result = await courseUseCases.listByGroup(String(req.params.id));
    respond(res, result, {
        courses_listed: (r) => ({ status: 200, body: r.courses }),
    });
}));
