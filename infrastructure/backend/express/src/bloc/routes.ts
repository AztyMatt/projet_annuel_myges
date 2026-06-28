import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { blocUseCases } from "@express/src/container";

export const blocRouter = Router();

blocRouter.get("/blocs", requireAuth, async (_req, res) => {
    const result = await blocUseCases.list();
    res.status(200).json(result.blocs);
});

blocRouter.get("/blocs/:id", requireAuth, async (req, res) => {
    const result = await blocUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Bloc not found" });
    res.status(200).json(result.bloc);
});

blocRouter.post("/blocs", requireAuth, requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN), async (req, res) => {
    const result = await blocUseCases.create(req.body);
    if (result.kind === "missing_fields")
        return void res.status(400).json({ error: "name and programId are required" });
    res.status(201).json(result.bloc);
});

blocRouter.patch(
    "/blocs/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await blocUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Bloc not found" });
        res.status(200).json(result.bloc);
    },
);

blocRouter.delete(
    "/blocs/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await blocUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Bloc not found" });
        res.status(200).json({ message: "Bloc deleted" });
    },
);

blocRouter.get("/blocs/:id/courses", requireAuth, async (req, res) => {
    const { courseUseCases } = await import("@express/src/container");
    const result = await courseUseCases.listByBloc(String(req.params.id));
    res.status(200).json(result.courses);
});
