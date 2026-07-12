import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { classUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";

const createClassSchema = z.object({
    number: z.number().int(),
    programId: z.string().min(1),
    size: z.number().int(),
});
const updateClassSchema = patchBody({
    number: z.number().int().optional(),
    programId: z.string().min(1).optional(),
    size: z.number().int().optional(),
});

export const classRouter = Router();

classRouter.get("/classes", ...authed(async (_req, res) => {
    const result = await classUseCases.list();
    send(res, { status: 200, body: result.classes });
}));

classRouter.get("/classes/:id", ...authed(async (req, res) => {
    const result = await classUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Classe introuvable" },
        class_found: (r) => ({ status: 200, body: r.class }),
    });
}));

classRouter.post("/classes", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await classUseCases.create(req.body, auth);
    respond(res, result, {
        program_not_found: { status: 404, error: "Filière introuvable" },
        class_number_already_exists: { blocked: { type: "Creation", reason: "Une classe avec ce numéro existe déjà dans cette filière" } },
        class_created: (r) => ({ status: 201, body: r.class }),
    });
}, createClassSchema));

classRouter.patch("/classes/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await classUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Classe introuvable" },
        program_not_found: { status: 404, error: "Filière introuvable" },
        class_number_already_exists: { blocked: { type: "Operation", reason: "Une classe avec ce numéro existe déjà dans cette filière" } },
        class_has_incompatible_courses: { blocked: { type: "Operation", reason: "Les cours existants sont incompatibles avec la filière cible (déplacez-les ou supprimez-les d'abord)" } },
        class_updated: (r) => ({ status: 200, body: r.class }),
    });
}, updateClassSchema));

classRouter.delete("/classes/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await classUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Classe introuvable" },
        class_has_groups_with_courses: { blocked: { type: "Deletion", reason: "La classe a des groupes avec des cours (supprimez d'abord les cours)" } },
        class_deleted: { status: 200, body: { message: "Classe supprimée" } },
    });
}));

classRouter.get("/classes/:id/groups", ...authed(async (req, res) => {
    const { groupUseCases } = await import("@express/src/container");
    const result = await groupUseCases.listByClass(String(req.params.id));
    send(res, { status: 200, body: result.groups });
}));
