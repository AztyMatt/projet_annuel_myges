import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { campusUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";

const createCampusSchema = z.object({ name: z.string().min(1), address: z.string().min(1) });
const updateCampusSchema = patchBody({ name: z.string().min(1).optional(), address: z.string().min(1).optional() });

export const campusRouter = Router();

campusRouter.get("/campuses", ...authed(async (_req, res) => {
    const result = await campusUseCases.list();
    send(res, { status: 200, body: result.campuses });
}));

campusRouter.get("/campuses/:id", ...authed(async (req, res) => {
    const result = await campusUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Campus introuvable" },
        campus_found: (r) => ({ status: 200, body: r.campus }),
    });
}));

campusRouter.post("/campuses", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await campusUseCases.create(req.body, auth);
    respond(res, result, {
        campus_already_exists: { blocked: { type: "Creation", reason: "Un campus avec ce nom existe déjà" } },
        campus_created: (r) => ({ status: 201, body: r.campus }),
    });
}, createCampusSchema));

campusRouter.patch("/campuses/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await campusUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Campus introuvable" },
        campus_already_exists: { blocked: { type: "Operation", reason: "Un campus avec ce nom existe déjà" } },
        campus_updated: (r) => ({ status: 200, body: r.campus }),
    });
}, updateCampusSchema));

campusRouter.delete("/campuses/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await campusUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Campus introuvable" },
        campus_has_classrooms: { blocked: { type: "Deletion", reason: "Le campus a des salles de classe" } },
        campus_deleted: { status: 200, body: { message: "Campus supprimé" } },
    });
}));

campusRouter.get("/campuses/:id/classrooms", ...authed(async (req, res) => {
    const { classroomUseCases } = await import("@express/src/container");
    const result = await classroomUseCases.listByCampus(String(req.params.id));
    send(res, { status: 200, body: result.classrooms });
}));
