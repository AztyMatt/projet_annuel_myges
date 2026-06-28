import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { adminUseCases } from "@express/src/container";

export const adminRouter = Router();

adminRouter.get("/admins", requireAuth, requireRole(AdminRole.SUPER_ADMIN), async (_req, res) => {
    const result = await adminUseCases.list();
    res.status(200).json(result.admins);
});

adminRouter.get("/admins/user/:userId", requireAuth, requireRole(AdminRole.SUPER_ADMIN), async (req, res) => {
    const result = await adminUseCases.findByUserId(String(req.params.userId));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Admin not found" });
    res.status(200).json(result.admin);
});

adminRouter.get("/admins/:id", requireAuth, requireRole(AdminRole.SUPER_ADMIN), async (req, res) => {
    const result = await adminUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Admin not found" });
    res.status(200).json(result.admin);
});

adminRouter.post("/admins", requireAuth, requireRole(AdminRole.SUPER_ADMIN), async (req, res) => {
    const result = await adminUseCases.create(req.body);
    if (result.kind === "missing_fields")
        return void res.status(400).json({ error: "userId and role are required" });
    if (result.kind === "user_already_admin")
        return void res.status(409).json({ error: "This user is already an admin" });
    res.status(201).json(result.admin);
});

adminRouter.patch("/admins/:id", requireAuth, requireRole(AdminRole.SUPER_ADMIN), async (req, res) => {
    const result = await adminUseCases.update(String(req.params.id), req.body);
    if (result.kind === "not_found") return void res.status(404).json({ error: "Admin not found" });
    res.status(200).json(result.admin);
});

adminRouter.delete("/admins/:id", requireAuth, requireRole(AdminRole.SUPER_ADMIN), async (req, res) => {
    const result = await adminUseCases.delete(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Admin not found" });
    res.status(200).json({ message: "Admin deleted" });
});
