import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { programUseCases } from "@express/src/container";
import { send, respond } from "@express/src/http/responses";

export const programRouter = Router();

programRouter.get("/programs", ...authed(async (_req, res) => {
    const result = await programUseCases.list();
    send(res, { status: 200, body: result.programs });
}));

programRouter.get("/programs/:id", ...authed(async (req, res) => {
    const result = await programUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Program not found" },
        program_found: (r) => ({ status: 200, body: r.program }),
    });
}));

programRouter.post("/programs", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await programUseCases.create(req.body, auth);
    respond(res, result, {
        missing_fields: { status: 400, error: "name and periodId are required" },
        program_already_exists: { blocked: { type: "Creation", reason: "A program with this name and code already exists" } },
        program_created: (r) => ({ status: 201, body: r.program }),
    });
}));

programRouter.patch("/programs/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await programUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Program not found" },
        program_already_exists: { blocked: { type: "Creation", reason: "A program with this name and code already exists" } },
        program_updated: (r) => ({ status: 200, body: r.program }),
    });
}));

programRouter.delete("/programs/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await programUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Program not found" },
        program_has_modules: { blocked: { type: "Deletion", reason: "Program has modules" } },
        program_has_classes: { blocked: { type: "Deletion", reason: "Program has classes" } },
        program_has_blocs: { blocked: { type: "Deletion", reason: "Program has blocs" } },
        program_has_students: { blocked: { type: "Deletion", reason: "Program has students" } },
        program_deleted: { status: 200, body: { message: "Program deleted" } },
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
        missing_fields: { status: 400, error: "moduleId, coefficient and ectsCredits are required" },
        program_module_created: (r) => ({ status: 201, body: r.programModule }),
    });
}));

programRouter.delete("/program-modules/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await programUseCases.removeModule(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Program module not found" },
        program_module_deleted: { status: 200, body: { message: "Program module deleted" } },
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
        missing_fields: { status: 400, error: "programId, moduleId, coefficient and ectsCredits are required" },
        program_module_created: (r) => ({ status: 201, body: r.programModule }),
    });
}));

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
