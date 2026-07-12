import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { classroomUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";

const createClassroomSchema = z.object({
    name: z.string().min(1),
    capacity: z.number().int().positive(),
    campusId: z.string().min(1),
});
const updateClassroomSchema = patchBody({
    name: z.string().min(1).optional(),
    capacity: z.number().int().positive().optional(),
    campusId: z.string().min(1).optional(),
});

export const classroomRouter = Router();

classroomRouter.get("/classrooms", ...authed(async (_req, res) => {
    const result = await classroomUseCases.list();
    send(res, { status: 200, body: result.classrooms });
}));

classroomRouter.get("/classrooms/:id", ...authed(async (req, res) => {
    const result = await classroomUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Salle introuvable" },
        classroom_found: (r) => ({ status: 200, body: r.classroom }),
    });
}));

classroomRouter.post("/classrooms", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await classroomUseCases.create(req.body, auth);
    respond(res, result, {
        campus_not_found: { status: 404, error: "Campus introuvable" },
        classroom_already_exists: { blocked: { type: "Creation", reason: "Une salle avec ce nom existe déjà dans ce campus" } },
        classroom_created: (r) => ({ status: 201, body: r.classroom }),
    });
}, createClassroomSchema));

classroomRouter.patch("/classrooms/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await classroomUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Salle introuvable" },
        campus_not_found: { status: 404, error: "Campus introuvable" },
        classroom_already_exists: { blocked: { type: "Operation", reason: "Une salle avec ce nom existe déjà dans ce campus" } },
        classroom_updated: (r) => ({ status: 200, body: r.classroom }),
    });
}, updateClassroomSchema));

classroomRouter.delete("/classrooms/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await classroomUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Salle introuvable" },
        classroom_has_sessions: { blocked: { type: "Deletion", reason: "La salle a des sessions" } },
        classroom_deleted: { status: 200, body: { message: "Salle supprimée" } },
    });
}));
