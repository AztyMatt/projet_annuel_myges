import { Router } from "express";
import { requireAuth, type AuthRequest } from "@express/src/auth/middleware";
import { messageUseCases } from "@express/src/container";

export const messageRouter = Router();

// message routes
messageRouter.get("/messages/conversation/:conversationId", requireAuth, async (req, res) => {
    const result = await messageUseCases.listByConversation(String(req.params.conversationId));
    res.status(200).json(result.messages);
});

messageRouter.get("/messages/sender/:senderId", requireAuth, async (req, res) => {
    const result = await messageUseCases.listBySender(String(req.params.senderId));
    res.status(200).json(result.messages);
});

messageRouter.get("/messages/:id", requireAuth, async (req, res) => {
    const result = await messageUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Message not found" });
    res.status(200).json(result.message);
});

messageRouter.post("/messages", requireAuth, async (req: AuthRequest, res) => {
    if (!req.auth) return void res.status(401).json({ error: "Unauthorized" });
    const result = await messageUseCases.send({ ...req.body, senderId: req.auth.userId });
    if (result.kind === "missing_fields")
        return void res.status(400).json({ error: "conversationId and content are required" });
    res.status(201).json(result.message);
});

messageRouter.delete("/messages/:id", requireAuth, async (req, res) => {
    const result = await messageUseCases.delete(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Message not found" });
    res.status(200).json({ message: "Message deleted" });
});

// message-read routes
messageRouter.get("/message-reads/message/:messageId", requireAuth, async (req, res) => {
    const result = await messageUseCases.listReadsByMessage(String(req.params.messageId));
    res.status(200).json(result.messageReads);
});

messageRouter.get("/message-reads/user/:userId", requireAuth, async (req, res) => {
    const result = await messageUseCases.listReadsByUser(String(req.params.userId));
    res.status(200).json(result.messageReads);
});

messageRouter.post("/message-reads", requireAuth, async (req, res) => {
    const result = await messageUseCases.markAsRead(req.body);
    if (result.kind === "missing_fields")
        return void res.status(400).json({ error: "messageId and userId are required" });
    res.status(201).json(result.messageRead);
});

messageRouter.delete("/message-reads", requireAuth, async (req, res) => {
    const result = await messageUseCases.markAsUnread(req.body);
    if (result.kind === "missing_fields")
        return void res.status(400).json({ error: "messageId and userId are required" });
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "Message read not found" });
    res.status(200).json({ message: "Message marked as unread" });
});
