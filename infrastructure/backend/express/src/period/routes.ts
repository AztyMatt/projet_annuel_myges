import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { periodUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";
import { patchBody, zDateString } from "@express/src/http/zod-schemas";

const createPeriodSchema = z.object({
    order: z.number().int(),
    startDate: zDateString,
    endDate: zDateString,
    academicYearId: z.string().min(1),
});
const updatePeriodSchema = patchBody({
    order: z.number().int().optional(),
    startDate: zDateString.optional(),
    endDate: zDateString.optional(),
    academicYearId: z.string().min(1).optional(),
});

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
        academic_year_not_found: { status: 404, error: "Academic year not found" },
        invalid_date_range: { status: 400, error: "startDate must be before endDate" },
        period_out_of_academic_year: { blocked: { type: "Creation", reason: "Period dates must fall within the academic year" } },
        period_overlap: { blocked: { type: "Creation", reason: "Period overlaps another period of this academic year" } },
        period_order_already_exists: { blocked: { type: "Creation", reason: "A period with this order already exists for this academic year" } },
        period_created: (r) => ({ status: 201, body: r.period }),
    });
}, createPeriodSchema));

periodRouter.patch("/periods/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await periodUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Period not found" },
        academic_year_not_found: { status: 404, error: "Academic year not found" },
        invalid_date_range: { status: 400, error: "startDate must be before endDate" },
        period_out_of_academic_year: { blocked: { type: "Operation", reason: "Period dates must fall within the academic year" } },
        period_overlap: { blocked: { type: "Operation", reason: "Period overlaps another period of this academic year" } },
        period_order_already_exists: { blocked: { type: "Operation", reason: "A period with this order already exists for this academic year" } },
        period_updated: (r) => ({ status: 200, body: r.period }),
    });
}, updatePeriodSchema));

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
