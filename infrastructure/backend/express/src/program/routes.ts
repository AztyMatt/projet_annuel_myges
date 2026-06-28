import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { programUseCases } from "@express/src/container";

export const programRouter = Router();

programRouter.get("/programs", requireAuth, async (_req, res) => {
    const result = await programUseCases.list();
    res.status(200).json(result.programs);
});

programRouter.get("/programs/:id", requireAuth, async (req, res) => {
    const result = await programUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Program not found" });
    res.status(200).json(result.program);
});

programRouter.post(
    "/programs",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await programUseCases.create(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "name and periodId are required" });
        res.status(201).json(result.program);
    },
);

programRouter.patch(
    "/programs/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await programUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Program not found" });
        res.status(200).json(result.program);
    },
);

programRouter.delete(
    "/programs/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await programUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Program not found" });
        res.status(200).json({ message: "Program deleted" });
    },
);

programRouter.get("/programs/:id/modules", requireAuth, async (req, res) => {
    const result = await programUseCases.listModulesByProgram(String(req.params.id));
    res.status(200).json(result.programModules);
});

programRouter.post(
    "/programs/:id/modules",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await programUseCases.addModule({ programId: String(req.params.id), moduleId: req.body.moduleId });
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "moduleId is required" });
        res.status(201).json(result.programModule);
    },
);

programRouter.get("/program-modules/program/:programId", requireAuth, async (req, res) => {
    const result = await programUseCases.listModulesByProgram(String(req.params.programId));
    res.status(200).json(result.programModules);
});

programRouter.get("/program-modules/module/:moduleId", requireAuth, async (req, res) => {
    const result = await programUseCases.listProgramsByModule(String(req.params.moduleId));
    res.status(200).json(result.programModules);
});

programRouter.post(
    "/program-modules",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await programUseCases.addModule(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "programId and moduleId are required" });
        res.status(201).json(result.programModule);
    },
);

programRouter.delete(
    "/program-modules/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await programUseCases.removeModule(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Program module not found" });
        res.status(200).json({ message: "Program module deleted" });
    },
);

programRouter.get("/programs/:id/blocs", requireAuth, async (req, res) => {
    const { blocUseCases } = await import("@express/src/container");
    const result = await blocUseCases.listByProgram(String(req.params.id));
    res.status(200).json(result.blocs);
});

programRouter.get("/programs/:id/classes", requireAuth, async (req, res) => {
    const { classUseCases } = await import("@express/src/container");
    const result = await classUseCases.listByProgram(String(req.params.id));
    res.status(200).json(result.classes);
});

programRouter.get("/programs/:id/students", requireAuth, async (req, res) => {
    const { studentUseCases } = await import("@express/src/container");
    const result = await studentUseCases.listByProgram(String(req.params.id));
    res.status(200).json(result.students);
});
