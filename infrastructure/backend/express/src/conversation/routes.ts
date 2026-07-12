import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { conversationUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";

export const conversationRouter = Router();

const createConversationPrivateSchema = z.object({
    userAId: z.string().min(1),
    userBId: z.string().min(1),
});

conversationRouter.get("/conversations", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await conversationUseCases.list(auth);
    respond(res, result, {
        conversations_listed: (r) => ({ status: 200, body: r.conversations }),
    });
}));

conversationRouter.get("/conversations/:id", ...authed(async (req, res) => {
    const result = await conversationUseCases.findById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Conversation not found" },
        conversation_found: (r) => ({ status: 200, body: r.conversation }),
    });
}));

conversationRouter.delete("/conversations/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await conversationUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Conversation not found" },
        conversation_is_private: { status: 403, error: "Forbidden: a private conversation can only be deleted by a super admin" },
        conversation_in_use: { blocked: { type: "Deletion", reason: "Conversation has a linked course or class" } },
        conversation_deleted: { status: 200, body: { message: "Conversation deleted" } },
    });
}));

conversationRouter.get("/conversation-privates", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await conversationUseCases.listPrivates(auth);
    respond(res, result, {
        conversation_privates_listed: (r) => ({ status: 200, body: r.conversationPrivates }),
    });
}));

conversationRouter.get("/conversation-privates/conversation/:conversationId", ...authed(async (req, res) => {
    const result = await conversationUseCases.findPrivateByConversation(String(req.params.conversationId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Private conversation not found" },
        conversation_private_found: (r) => ({ status: 200, body: r.conversationPrivate }),
    });
}));

conversationRouter.get("/conversation-privates/mine", ...authed(async (req, res) => {
    const result = await conversationUseCases.listMinePrivates(getAuthFlags(req.auth));
    respond(res, result, {
        conversation_privates_listed: (r) => ({ status: 200, body: r.conversationPrivates }),
    });
}));

conversationRouter.get("/conversation-privates/:id", ...authed(async (req, res) => {
    const result = await conversationUseCases.findPrivateById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Private conversation not found" },
        conversation_private_found: (r) => ({ status: 200, body: r.conversationPrivate }),
    });
}));

conversationRouter.post("/conversation-privates", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await conversationUseCases.createPrivate(req.body, auth);
    respond(res, result, {
        same_user: { status: 400, error: "Cannot open a private conversation with yourself" },
        not_found: { status: 404, error: "The other user does not exist" },
        conversation_already_exists: { blocked: { type: "Creation", reason: "A private conversation already exists between these two users" } },
        conversation_private_created: (r) => ({ status: 201, body: r.conversationPrivate }),
    });
}, createConversationPrivateSchema));

conversationRouter.delete("/conversation-privates/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await conversationUseCases.deletePrivate(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Private conversation not found" },
        conversation_private_deleted: { status: 200, body: { message: "Private conversation deleted" } },
    });
}));
