import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { programUseCases } from "@express/src/container";
import { send, respond } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";

const createProgramSchema = z.object({ name: z.string().min(1), code: z.string().optional(), periodId: z.string().min(1) });
const updateProgramSchema = patchBody({ name: z.string().min(1).optional(), code: z.string().optional(), periodId: z.string().min(1).optional() });
const addProgramModuleSchema = z.object({ moduleId: z.string().min(1), coefficient: z.number().int().positive(), ectsCredits: z.number().int().positive() });
const createProgramModuleSchema = z.object({ programId: z.string().min(1), moduleId: z.string().min(1), coefficient: z.number().int().positive(), ectsCredits: z.number().int().positive() });

export const programRouter = Router();

programRouter.get("/programs", ...authed(async (_req, res) => {
    const result = await programUseCases.list();
    send(res, { status: 200, body: result.programs });
}));

programRouter.get("/programs/:id", ...authed(async (req, res) => {
    const result = await programUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Filière introuvable" },
        program_found: (r) => ({ status: 200, body: r.program }),
    });
}));

programRouter.post("/programs", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await programUseCases.create(req.body, auth);
    respond(res, result, {
        period_not_found: { status: 404, error: "Période introuvable" },
        program_already_exists: { blocked: { type: "Creation", reason: "Une filière avec ce nom et ce code existe déjà" } },
        program_created: (r) => ({ status: 201, body: r.program }),
    });
}, createProgramSchema));

programRouter.patch("/programs/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await programUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Filière introuvable" },
        period_not_found: { status: 404, error: "Période introuvable" },
        program_already_exists: { blocked: { type: "Operation", reason: "Une filière avec ce nom et ce code existe déjà" } },
        program_updated: (r) => ({ status: 200, body: r.program }),
    });
}, updateProgramSchema));

programRouter.delete("/programs/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await programUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Filière introuvable" },
        program_has_modules: { blocked: { type: "Deletion", reason: "La filière a des modules" } },
        program_has_classes: { blocked: { type: "Deletion", reason: "La filière a des classes" } },
        program_has_blocs: { blocked: { type: "Deletion", reason: "La filière a des blocs" } },
        program_has_students: { blocked: { type: "Deletion", reason: "La filière a des étudiants" } },
        program_deleted: { status: 200, body: { message: "Filière supprimée" } },
    });
}));

programRouter.get("/programs/:id/modules", ...authed(async (req, res) => {
    const result = await programUseCases.listModulesByProgram(String(req.params.id));
    send(res, { status: 200, body: result.programModules });
}));

programRouter.post("/programs/:id/modules", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await programUseCases.addModule({ programId: String(req.params.id), ...req.body }, auth);
    respond(res, result, {
        program_not_found: { status: 404, error: "Filière introuvable" },
        module_not_found: { status: 404, error: "Module introuvable" },
        program_module_already_exists: { blocked: { type: "Creation", reason: "Ce module est déjà rattaché à cette filière" } },
        program_module_created: (r) => ({ status: 201, body: r.programModule }),
    });
}, addProgramModuleSchema));

programRouter.delete("/program-modules/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await programUseCases.removeModule(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Module de filière introuvable" },
        program_module_deleted: { status: 200, body: { message: "Module de filière supprimé" } },
    });
}));

programRouter.get("/program-modules/program/:programId", ...authed(async (req, res) => {
    const result = await programUseCases.listModulesByProgram(String(req.params.programId));
    send(res, { status: 200, body: result.programModules });
}));

programRouter.get("/program-modules/module/:moduleId", ...authed(async (req, res) => {
    const result = await programUseCases.listProgramsByModule(String(req.params.moduleId));
    send(res, { status: 200, body: result.programModules });
}));

programRouter.post("/program-modules", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await programUseCases.addModule(req.body, auth);
    respond(res, result, {
        program_not_found: { status: 404, error: "Filière introuvable" },
        module_not_found: { status: 404, error: "Module introuvable" },
        program_module_already_exists: { blocked: { type: "Creation", reason: "Ce module est déjà rattaché à cette filière" } },
        program_module_created: (r) => ({ status: 201, body: r.programModule }),
    });
}, createProgramModuleSchema));

programRouter.get("/programs/:id/blocs", ...authed(async (req, res) => {
    const { blocUseCases } = await import("@express/src/container");
    const result = await blocUseCases.listByProgram(String(req.params.id));
    send(res, { status: 200, body: result.blocs });
}));

programRouter.get("/programs/:id/classes", ...authed(async (req, res) => {
    const { classUseCases } = await import("@express/src/container");
    const result = await classUseCases.listByProgram(String(req.params.id));
    send(res, { status: 200, body: result.classes });
}));

programRouter.get("/programs/:id/students", ...authed(async (req, res) => {
    const { studentUseCases } = await import("@express/src/container");
    const result = await studentUseCases.listByProgram(String(req.params.id));
    respond(res, result, {
        students_listed: (r) => ({ status: 200, body: r.students }),
    });
}));
