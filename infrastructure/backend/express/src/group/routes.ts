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
        not_found: { status: 404, error: "Groupe introuvable" },
        group_found: (r) => ({ status: 200, body: r.group }),
    });
}));

groupRouter.post("/groups", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await groupUseCases.create(req.body, auth);
    respond(res, result, {
        class_not_found: { status: 404, error: "Classe introuvable" },
        group_name_general_reserved: { blocked: { type: "Creation", reason: "\"General\" est un nom réservé (le groupe de base est créé automatiquement avec la classe)" } },
        group_already_exists: { blocked: { type: "Creation", reason: "Un groupe avec ce nom existe déjà dans cette classe" } },
        group_created: (r) => ({ status: 201, body: r.group }),
    });
}, createGroupSchema));

groupRouter.patch("/groups/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await groupUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Groupe introuvable" },
        class_not_found: { status: 404, error: "Classe introuvable" },
        general_group_cannot_be_renamed: { blocked: { type: "Operation", reason: "Le groupe General ne peut pas être renommé (c'est le groupe de base de la classe)" } },
        group_name_general_reserved: { blocked: { type: "Operation", reason: "\"General\" est un nom réservé et ne peut pas être attribué à un autre groupe" } },
        general_group_cannot_be_moved: { blocked: { type: "Operation", reason: "Le groupe General ne peut pas être déplacé vers une autre classe" } },
        group_already_exists: { blocked: { type: "Operation", reason: "Un groupe avec ce nom existe déjà dans cette classe" } },
        group_has_incompatible_courses: { blocked: { type: "Operation", reason: "Les cours du groupe sont incompatibles avec le programme de la classe cible (déplacez-les ou supprimez-les d'abord)" } },
        group_updated: (r) => ({ status: 200, body: r.group }),
    });
}, updateGroupSchema));

groupRouter.delete("/groups/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await groupUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Groupe introuvable" },
        general_group_cannot_be_deleted: { blocked: { type: "Operation", reason: "Impossible de supprimer le groupe General (supprimez la classe à la place)" } },
        group_has_students: { blocked: { type: "Deletion", reason: "Le groupe a des étudiants" } },
        group_has_courses: { blocked: { type: "Deletion", reason: "Le groupe a des cours" } },
        group_deleted: { status: 200, body: { message: "Groupe supprimé" } },
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
        group_not_found: { status: 404, error: "Groupe introuvable" },
        student_not_found: { status: 404, error: "Étudiant introuvable" },
        student_already_in_group: { blocked: { type: "Creation", reason: "Cet étudiant est déjà dans ce groupe" } },
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
        group_not_found: { status: 404, error: "Groupe introuvable" },
        student_not_found: { status: 404, error: "Étudiant introuvable" },
        student_already_in_group: { blocked: { type: "Creation", reason: "Cet étudiant est déjà dans ce groupe" } },
        student_group_created: (r) => ({ status: 201, body: r.studentGroup }),
    });
}, addStudentGroupSchema));

groupRouter.delete("/student-groups/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await groupUseCases.removeStudent(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Groupe d'étudiants introuvable" },
        student_group_deleted: { status: 200, body: { message: "Groupe d'étudiants supprimé" } },
    });
}));

groupRouter.get("/groups/:id/courses", ...authed(async (req, res) => {
    const { courseUseCases } = await import("@express/src/container");
    const result = await courseUseCases.listByGroup(String(req.params.id));
    respond(res, result, {
        courses_listed: (r) => ({ status: 200, body: r.courses }),
    });
}));
