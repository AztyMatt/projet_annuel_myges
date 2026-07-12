import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { absenceUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";

export const absenceRouter = Router();

const declareAbsenceSchema = z.object({
    studentId: z.string().min(1),
    sessionId: z.string().min(1),
    reason: z.string().min(1),
});

absenceRouter.get("/absences", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await absenceUseCases.list(auth);
    respond(res, result, {
        absences_listed: (r) => ({ status: 200, body: r.absences }),
    });
}));

absenceRouter.get("/absences/student/:studentId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await absenceUseCases.listByStudent(String(req.params.studentId), auth);
    respond(res, result, {
        absences_listed: (r) => ({ status: 200, body: r.absences }),
    });
}));

absenceRouter.get("/absences/mine", ...authed(async (req, res) => {
    const result = await absenceUseCases.listMine(getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Student profile not found" },
        absences_listed: (r) => ({ status: 200, body: r.absences }),
    });
}));

absenceRouter.get("/absences/:id", ...authed(async (req, res) => {
    const result = await absenceUseCases.findById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Absence not found" },
        absence_found: (r) => ({ status: 200, body: r.absence }),
    });
}));

absenceRouter.post("/absences", ...authed(async (req, res) => {
    const result = await absenceUseCases.declare(req.body, getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Session not found" },
        student_not_in_course: { status: 404, error: "Student is not enrolled in this course" },
        session_not_started: { blocked: { type: "Creation", reason: "An absence can only be declared for a past or ongoing session" } },
        absence_already_exists: { blocked: { type: "Creation", reason: "An absence is already declared for this student and session" } },
        absence_declared: (r) => ({ status: 201, body: r.absence }),
    });
}, declareAbsenceSchema));

absenceRouter.post("/absences/:id/validate", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await absenceUseCases.validate(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Absence not found" },
        absence_already_processed: { blocked: { type: "Operation", reason: "Absence already processed, only a super admin can change its status" } },
        absence_validated: (r) => ({ status: 200, body: r.absence }),
    });
}));

absenceRouter.post("/absences/:id/reject", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await absenceUseCases.reject(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Absence not found" },
        absence_already_processed: { blocked: { type: "Operation", reason: "Absence already processed, only a super admin can change its status" } },
        absence_rejected: (r) => ({ status: 200, body: r.absence }),
    });
}));

absenceRouter.delete("/absences/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await absenceUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Absence not found" },
        absence_is_validated: { blocked: { type: "Operation", reason: "absence is validated, only a super admin can delete it" } },
        absence_deleted_with_warnings: (r) => ({ status: 200, body: { message: "Absence deleted", storageWarnings: r.failedPaths } }),
        absence_deleted: { status: 200, body: { message: "Absence deleted" } },
    });
}));

absenceRouter.get("/sessions/:sessionId/absences", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await absenceUseCases.listBySession(String(req.params.sessionId), auth);
    respond(res, result, {
        absences_listed: (r) => ({ status: 200, body: r.absences }),
    });
}));
