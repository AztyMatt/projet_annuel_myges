import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { companyUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";

export const companyRouter = Router();

const createCompanySchema = z.object({
    name: z.string().min(1),
    siret: z.string().min(1),
    address: z.string().min(1),
    contactName: z.string().min(1),
    contactNumber: z.string().min(1).nullish(),
    contactEmail: z.email().nullish(),
});

const updateCompanySchema = patchBody({
    name: z.string().min(1).optional(),
    siret: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    contactName: z.string().min(1).optional(),
    contactNumber: z.string().nullish(),
    contactEmail: z.email().nullish(),
});

companyRouter.get("/companies", ...authed(async (_req, res) => {
    const result = await companyUseCases.list();
    send(res, { status: 200, body: result.companies });
}));

companyRouter.get("/companies/:id", ...authed(async (req, res) => {
    const result = await companyUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Company not found" },
        company_found: (r) => ({ status: 200, body: r.company }),
    });
}));

companyRouter.post("/companies", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await companyUseCases.create(req.body, auth);
    respond(res, result, {
        siret_already_exists: { blocked: { type: "Creation", reason: "A company with this SIRET already exists" } },
        company_created: (r) => ({ status: 201, body: r.company }),
    });
}, createCompanySchema));

companyRouter.patch("/companies/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await companyUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Company not found" },
        siret_already_exists: { blocked: { type: "Operation", reason: "A company with this SIRET already exists" } },
        company_updated: (r) => ({ status: 200, body: r.company }),
    });
}, updateCompanySchema));

companyRouter.delete("/companies/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await companyUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Company not found" },
        company_has_contracts: { blocked: { type: "Deletion", reason: "Company has apprenticeship contracts" } },
        company_deleted: { status: 200, body: { message: "Company deleted" } },
    });
}));
