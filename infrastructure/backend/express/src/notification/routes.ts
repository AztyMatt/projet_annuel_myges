import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { notificationUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";

export const notificationRouter = Router();

notificationRouter.get("/notifications/mine", ...authed(async (req, res) => {
    const result = await notificationUseCases.listMine(getAuthFlags(req.auth));
    respond(res, result, {
        notifications_listed: (r) => ({ status: 200, body: r.notifications }),
    });
}));

notificationRouter.get("/notifications/mine/unread-count", ...authed(async (req, res) => {
    const result = await notificationUseCases.unreadCount(getAuthFlags(req.auth));
    respond(res, result, {
        unread_count: (r) => ({ status: 200, body: { count: r.count } }),
    });
}));

notificationRouter.post("/notifications/:id/read", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await notificationUseCases.markAsRead(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Notification introuvable" },
        notification_marked_as_read: { status: 200, body: { message: "Notification marquée comme lue" } },
    });
}));

notificationRouter.post("/notifications/read-all", ...authed(async (req, res) => {
    const result = await notificationUseCases.markAllAsRead(getAuthFlags(req.auth));
    respond(res, result, {
        all_notifications_marked_as_read: { status: 200, body: { message: "Toutes les notifications ont été marquées comme lues" } },
    });
}));
