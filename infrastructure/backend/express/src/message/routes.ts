import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { messageUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";

const sendMessageSchema = z.object({ conversationId: z.string().min(1), content: z.string().min(1) });
const markAsReadSchema = z.object({ messageId: z.string().min(1) });

export const messageRouter = Router();

messageRouter.get("/messages/conversation/:conversationId", ...authed(async (req, res) => {
    const result = await messageUseCases.listByConversation(String(req.params.conversationId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Conversation introuvable" },
        messages_listed: (r) => ({ status: 200, body: r.messages }),
    });
}));

messageRouter.get("/messages/sender/:senderId", ...authed(async (req, res) => {
    const result = await messageUseCases.listBySender(String(req.params.senderId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Messages introuvables" },
        messages_listed: (r) => ({ status: 200, body: r.messages }),
    });
}));

messageRouter.get("/messages/:id", ...authed(async (req, res) => {
    const result = await messageUseCases.findById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Message introuvable" },
        message_found: (r) => ({ status: 200, body: r.message }),
    });
}));

messageRouter.post("/messages", ...authed(async (req, res) => {
    const result = await messageUseCases.send({ ...req.body, senderId: req.auth.userId });
    respond(res, result, {
        not_found: { status: 404, error: "Conversation introuvable" },
        message_sent: (r) => ({ status: 201, body: r.message }),
    });
}, sendMessageSchema));

messageRouter.delete("/messages/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await messageUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Message introuvable" },
        message_deleted: { status: 200, body: { message: "Message supprimé" } },
    });
}));

messageRouter.get("/message-reads/message/:messageId", ...authed(async (req, res) => {
    const result = await messageUseCases.listReadsByMessage(String(req.params.messageId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Message introuvable" },
        message_reads_listed: (r) => ({ status: 200, body: r.messageReads }),
    });
}));

messageRouter.get("/message-reads/user/:userId", ...authed(async (req, res) => {
    const result = await messageUseCases.listReadsByUser(String(req.params.userId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Lectures de message introuvables" },
        message_reads_listed: (r) => ({ status: 200, body: r.messageReads }),
    });
}));

messageRouter.post("/message-reads", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await messageUseCases.markAsRead({ messageId: req.body.messageId }, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Message introuvable" },
        message_marked_as_read: (r) => ({ status: 200, body: r.messageRead }),
    });
}, markAsReadSchema));

messageRouter.delete("/message-reads", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await messageUseCases.markAsUnread({ messageId: req.body.messageId }, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Lecture de message introuvable" },
        message_marked_as_unread: { status: 200, body: { message: "Message marqué comme non lu" } },
    });
}, markAsReadSchema));
