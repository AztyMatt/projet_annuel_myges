import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { classUseCases } from "@express/src/container";

export const classRouter = Router();

classRouter.get("/classes", requireAuth, async (_req, res) => {
    const result = await classUseCases.list();
    res.status(200).json(result.classes);
});

classRouter.get("/classes/:id", requireAuth, async (req, res) => {
    const result = await classUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Class not found" });
    res.status(200).json(result.class);
});

classRouter.post("/classes", requireAuth, requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN), async (req, res) => {
    const result = await classUseCases.create(req.body);
    if (result.kind === "missing_fields")
        return void res
            .status(400)
            .json({ error: "number, programId, size and conversationId are required" });
    res.status(201).json(result.class);
});

classRouter.patch(
    "/classes/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await classUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Class not found" });
        res.status(200).json(result.class);
    },
);

classRouter.delete(
    "/classes/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await classUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Class not found" });
        res.status(200).json({ message: "Class deleted" });
    },
);

classRouter.get("/classes/:id/groups", requireAuth, async (req, res) => {
    const { groupUseCases } = await import("@express/src/container");
    const result = await groupUseCases.listByClass(String(req.params.id));
    res.status(200).json(result.groups);
});
