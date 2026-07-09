import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { periodUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";

export const periodRouter = Router();

periodRouter.get("/periods", ...authed(async (_req, res) => {
    const result = await periodUseCases.list();
    send(res, { status: 200, body: result.periods });
}));

periodRouter.get("/periods/:id", ...authed(async (req, res) => {
    const result = await periodUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Period not found" },
        period_found: (r) => ({ status: 200, body: r.period }),
    });
}));

periodRouter.post("/periods", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await periodUseCases.create(req.body, auth);
    respond(res, result, {
        missing_fields: { status: 400, error: "order, startDate, endDate and academicYearId are required" },
        period_order_already_exists: { blocked: { type: "Creation", reason: "A period with this order already exists for this academic year" } },
        period_created: (r) => ({ status: 201, body: r.period }),
    });
}));

periodRouter.patch("/periods/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await periodUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Period not found" },
        period_updated: (r) => ({ status: 200, body: r.period }),
    });
}));

periodRouter.delete("/periods/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await periodUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Period not found" },
        period_has_programs: { blocked: { type: "Deletion", reason: "Period has programs" } },
        period_deleted: { status: 200, body: { message: "Period deleted" } },
    });
}));

periodRouter.get("/periods/:id/programs", ...authed(async (req, res) => {
    const { programUseCases } = await import("@express/src/container");
    const result = await programUseCases.listByPeriod(String(req.params.id));
    send(res, { status: 200, body: result.programs });
}));
