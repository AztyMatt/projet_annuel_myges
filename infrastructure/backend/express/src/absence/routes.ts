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
        not_found: { status: 404, error: "Profil étudiant introuvable" },
        absences_listed: (r) => ({ status: 200, body: r.absences }),
    });
}));

absenceRouter.get("/absences/:id", ...authed(async (req, res) => {
    const result = await absenceUseCases.findById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Absence introuvable" },
        absence_found: (r) => ({ status: 200, body: r.absence }),
    });
}));

absenceRouter.post("/absences", ...authed(async (req, res) => {
    const result = await absenceUseCases.declare(req.body, getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Session introuvable" },
        student_not_in_course: { status: 404, error: "L'étudiant n'est pas inscrit à ce cours" },
        session_not_started: { blocked: { type: "Creation", reason: "Une absence ne peut être déclarée que pour une session passée ou en cours" } },
        absence_already_exists: { blocked: { type: "Creation", reason: "Une absence est déjà déclarée pour cet étudiant et cette session" } },
        absence_declared: (r) => ({ status: 201, body: r.absence }),
    });
}, declareAbsenceSchema));

absenceRouter.post("/absences/:id/validate", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await absenceUseCases.validate(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Absence introuvable" },
        absence_already_processed: { blocked: { type: "Operation", reason: "Absence déjà traitée, seul un super administrateur peut changer son statut" } },
        absence_validated: (r) => ({ status: 200, body: r.absence }),
    });
}));

absenceRouter.post("/absences/:id/reject", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await absenceUseCases.reject(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Absence introuvable" },
        absence_already_processed: { blocked: { type: "Operation", reason: "Absence déjà traitée, seul un super administrateur peut changer son statut" } },
        absence_rejected: (r) => ({ status: 200, body: r.absence }),
    });
}));

absenceRouter.delete("/absences/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await absenceUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Absence introuvable" },
        absence_is_validated: { blocked: { type: "Operation", reason: "l'absence est validée, seul un super administrateur peut la supprimer" } },
        absence_deleted_with_warnings: (r) => ({ status: 200, body: { message: "Absence supprimée", storageWarnings: r.failedPaths } }),
        absence_deleted: { status: 200, body: { message: "Absence supprimée" } },
    });
}));

absenceRouter.get("/sessions/:sessionId/absences", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await absenceUseCases.listBySession(String(req.params.sessionId), auth);
    respond(res, result, {
        absences_listed: (r) => ({ status: 200, body: r.absences }),
    });
}));
