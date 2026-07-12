import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { academicYearUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";
import { zDateString, patchBody } from "@express/src/http/zod-schemas";

const createAcademicYearSchema = z.object({
    startDate: zDateString,
    endDate: zDateString,
});
const updateAcademicYearSchema = patchBody({
    startDate: zDateString.optional(),
    endDate: zDateString.optional(),
});

const setCurrentAcademicYearSchema = z.object({
    academicYearId: z.string().min(1),
});

export const academicYearRouter = Router();

academicYearRouter.get("/academic-years", ...authed(async (_req, res) => {
    const result = await academicYearUseCases.list();
    send(res, { status: 200, body: result.academicYears });
}));

academicYearRouter.get("/academic-years/current", ...authed(async (_req, res) => {
    const result = await academicYearUseCases.getCurrent();
    respond(res, result, {
        not_found: { status: 404, error: "No current academic year found" },
        academic_year_found: (r) => ({ status: 200, body: r.academicYear }),
    });
}));

academicYearRouter.get("/academic-years/:id", ...authed(async (req, res) => {
    const result = await academicYearUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Academic year not found" },
        academic_year_found: (r) => ({ status: 200, body: r.academicYear }),
    });
}));

academicYearRouter.post("/academic-years", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await academicYearUseCases.create(req.body, auth);
    respond(res, result, {
        invalid_date_range: { status: 400, error: "startDate must be before endDate" },
        academic_year_already_exists: { blocked: { type: "Creation", reason: "An academic year with these dates already exists" } },
        academic_year_created: (r) => ({ status: 201, body: r.academicYear }),
    });
}, createAcademicYearSchema));

academicYearRouter.patch("/academic-years/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await academicYearUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Academic year not found" },
        invalid_date_range: { status: 400, error: "startDate must be before endDate" },
        academic_year_already_exists: { blocked: { type: "Operation", reason: "An academic year with these dates already exists" } },
        academic_year_periods_out_of_range: { blocked: { type: "Operation", reason: "Some periods would fall outside the new academic year dates (adjust or move them first)" } },
        academic_year_updated: (r) => ({ status: 200, body: r.academicYear }),
    });
}, updateAcademicYearSchema));

academicYearRouter.put("/academic-years/current", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await academicYearUseCases.setCurrent(String(req.body.academicYearId), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Academic year not found" },
        academic_year_current_set: (r) => ({ status: 200, body: r.academicYear }),
    });
}, setCurrentAcademicYearSchema));

academicYearRouter.delete("/academic-years/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await academicYearUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Academic year not found" },
        academic_year_is_current: { blocked: { type: "Operation", reason: "Cannot delete the current academic year" } },
        academic_year_has_periods: { blocked: { type: "Deletion", reason: "Academic year has periods" } },
        academic_year_deleted: { status: 200, body: { message: "Academic year deleted" } },
    });
}));

academicYearRouter.get("/academic-years/:id/periods", ...authed(async (req, res) => {
    const { periodUseCases } = await import("@express/src/container");
    const result = await periodUseCases.listByAcademicYear(String(req.params.id));
    send(res, { status: 200, body: result.periods });
}));
