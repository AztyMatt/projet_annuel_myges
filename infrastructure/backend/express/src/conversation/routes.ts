import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { conversationUseCases } from "@express/src/container";

export const conversationRouter = Router();

conversationRouter.get(
    "/conversations",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (_req, res) => {
        const result = await conversationUseCases.list();
        res.status(200).json(result.conversations);
    },
);

conversationRouter.get("/conversations/:id", requireAuth, async (req, res) => {
    const result = await conversationUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Conversation not found" });
    res.status(200).json(result.conversation);
});

conversationRouter.post(
    "/conversations",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (_req, res) => {
        const result = await conversationUseCases.create();
        res.status(201).json(result.conversation);
    },
);

conversationRouter.delete(
    "/conversations/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await conversationUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Conversation not found" });
        res.status(200).json({ message: "Conversation deleted" });
    },
);

// conversation-private routes
conversationRouter.get(
    "/conversation-privates",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (_req, res) => {
        const result = await conversationUseCases.listPrivates();
        res.status(200).json(result.conversationPrivates);
    },
);

conversationRouter.get(
    "/conversation-privates/conversation/:conversationId",
    requireAuth,
    async (req, res) => {
        const result = await conversationUseCases.findPrivateByConversation(
            String(req.params.conversationId),
        );
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Private conversation not found" });
        res.status(200).json(result.conversationPrivate);
    },
);

conversationRouter.get(
    "/conversation-privates/admin/:adminId",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await conversationUseCases.listPrivatesByAdmin(String(req.params.adminId));
        res.status(200).json(result.conversationPrivates);
    },
);

conversationRouter.get(
    "/conversation-privates/student/:studentId",
    requireAuth,
    async (req, res) => {
        const result = await conversationUseCases.listPrivatesByStudent(String(req.params.studentId));
        res.status(200).json(result.conversationPrivates);
    },
);

conversationRouter.get("/conversation-privates/:id", requireAuth, async (req, res) => {
    const result = await conversationUseCases.findPrivateById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "Private conversation not found" });
    res.status(200).json(result.conversationPrivate);
});

conversationRouter.post(
    "/conversation-privates",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await conversationUseCases.createPrivate(req.body);
        if (result.kind === "missing_fields")
            return void res
                .status(400)
                .json({ error: "adminId, studentId and conversationId are required" });
        if (result.kind === "conversation_already_exists")
            return void res.status(409).json({ error: "A private conversation already exists between this admin and student" });
        res.status(201).json(result.conversationPrivate);
    },
);

conversationRouter.delete(
    "/conversation-privates/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await conversationUseCases.deletePrivate(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Private conversation not found" });
        res.status(200).json({ message: "Private conversation deleted" });
    },
);
