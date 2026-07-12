import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { documentUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";
import { storageCleanupWarning } from "@express/src/storage/storage-warning";
import { patchBody, zDateString } from "@express/src/http/zod-schemas";
import { DocumentType } from "@domain/document/document-administrative/document-administrative.enums";
import { DocumentApprenticeshipContractType } from "@domain/document/document-apprenticeship-contract/document-apprenticeship-contract.enums";

const zDocumentType = z.enum(Object.values(DocumentType) as [string, ...string[]]);
const zContractType = z.enum(Object.values(DocumentApprenticeshipContractType) as [string, ...string[]]);

const createAdministrativeSchema = z.object({ fileDocumentId: z.string().min(1), type: zDocumentType, expiration: zDateString.nullish() });
const updateAdministrativeSchema = patchBody({ type: zDocumentType.optional(), expiration: zDateString.nullish() });
const createApprenticeshipContractSchema = z.object({ fileDocumentId: z.string().min(1), companyId: z.string().nullish(), type: zContractType, startDate: zDateString, endDate: zDateString });
const updateApprenticeshipContractSchema = patchBody({ companyId: z.string().nullish(), type: zContractType.optional(), startDate: zDateString.optional(), endDate: zDateString.optional() });

export const documentRouter = Router();

documentRouter.get("/document-administratives", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.listAdministratives(auth);
    respond(res, result, {
        document_administratives_listed: (r) => ({ status: 200, body: r.documents }),
    });
}));

documentRouter.get("/document-administratives/file-document/:fileDocumentId", ...authed(async (req, res) => {
    const result = await documentUseCases.findAdministrativeByFileDocument(String(req.params.fileDocumentId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Document administrative not found" },
        document_administrative_found: (r) => ({ status: 200, body: r.document }),
    });
}));

documentRouter.get("/document-administratives/mine", ...authed(async (req, res) => {
    const result = await documentUseCases.listMineAdministrative(getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Student profile not found" },
        document_administratives_listed: (r) => ({ status: 200, body: r.documents }),
    });
}));

documentRouter.get("/document-administratives/:id", ...authed(async (req, res) => {
    const result = await documentUseCases.findAdministrativeById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Document administrative not found" },
        document_administrative_found: (r) => ({ status: 200, body: r.document }),
    });
}));

documentRouter.post("/document-administratives", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.createAdministrative(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "File document not found" },
        administrative_already_exists: { blocked: { type: "Creation", reason: "An administrative document already exists for this file document" } },
        file_document_type_conflict: { blocked: { type: "Creation", reason: "File document is already linked to another document type" } },
        file_too_large: { status: 400, error: "File exceeds the maximum allowed size for this document type" },
        mime_type_not_allowed: { status: 400, error: "This file type is not allowed for this document type" },
        document_administrative_created: (r) => ({ status: 201, body: r.document }),
    });
}, createAdministrativeSchema));

documentRouter.patch("/document-administratives/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.updateAdministrative(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Document administrative not found" },
        file_too_large: { status: 400, error: "File exceeds the maximum allowed size for this document type" },
        mime_type_not_allowed: { status: 400, error: "This file type is not allowed for this document type" },
        valid_document_of_type_exists: { blocked: { type: "Operation", reason: "This student already has a valid document of this type" } },
        document_administrative_updated: (r) => ({ status: 200, body: r.document }),
    });
}, updateAdministrativeSchema));

documentRouter.delete("/document-administratives/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.deleteAdministrative(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Document administrative not found" },
        file_document_is_valid: { blocked: { type: "Operation", reason: "Associated file document is validated" } },
        document_administrative_deleted_with_warnings: (r) => storageCleanupWarning("Document administrative deleted", r.failedPaths),
        document_administrative_deleted: { status: 200, body: { message: "Document administrative deleted" } },
    });
}));

documentRouter.get("/document-apprenticeship-contracts", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.listApprenticeshipContracts(auth);
    respond(res, result, {
        document_apprenticeship_contracts_listed: (r) => ({ status: 200, body: r.contracts }),
    });
}));

documentRouter.get("/document-apprenticeship-contracts/company/:companyId", ...authed(async (req, res) => {
    const result = await documentUseCases.listApprenticeshipContractsByCompany(String(req.params.companyId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Apprenticeship contracts not found" },
        document_apprenticeship_contracts_listed: (r) => ({ status: 200, body: r.contracts }),
    });
}));

documentRouter.get("/document-apprenticeship-contracts/file-document/:fileDocumentId", ...authed(async (req, res) => {
    const result = await documentUseCases.findApprenticeshipContractByFileDocument(String(req.params.fileDocumentId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Apprenticeship contract not found" },
        document_apprenticeship_contract_found: (r) => ({ status: 200, body: r.contract }),
    });
}));

documentRouter.get("/document-apprenticeship-contracts/mine", ...authed(async (req, res) => {
    const result = await documentUseCases.listMineApprenticeshipContracts(getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Student profile not found" },
        document_apprenticeship_contracts_listed: (r) => ({ status: 200, body: r.contracts }),
    });
}));

documentRouter.get("/document-apprenticeship-contracts/:id", ...authed(async (req, res) => {
    const result = await documentUseCases.findApprenticeshipContractById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Apprenticeship contract not found" },
        document_apprenticeship_contract_found: (r) => ({ status: 200, body: r.contract }),
    });
}));

documentRouter.post("/document-apprenticeship-contracts", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.createApprenticeshipContract(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "File document not found" },
        invalid_date_range: { status: 400, error: "startDate must be before endDate" },
        company_not_found: { status: 404, error: "Company not found" },
        contract_already_exists: { blocked: { type: "Creation", reason: "An apprenticeship contract already exists for this file document" } },
        file_document_type_conflict: { blocked: { type: "Creation", reason: "File document is already linked to another document type" } },
        file_too_large: { status: 400, error: "File exceeds the maximum allowed size for this document type" },
        mime_type_not_allowed: { status: 400, error: "This file type is not allowed for this document type" },
        document_apprenticeship_contract_created: (r) => ({ status: 201, body: r.contract }),
    });
}, createApprenticeshipContractSchema));

documentRouter.patch("/document-apprenticeship-contracts/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.updateApprenticeshipContract(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Apprenticeship contract not found" },
        invalid_date_range: { status: 400, error: "startDate must be before endDate" },
        company_not_found: { status: 404, error: "Company not found" },
        valid_document_of_type_exists: { blocked: { type: "Operation", reason: "This student already has a valid document of this type" } },
        document_apprenticeship_contract_updated: (r) => ({ status: 200, body: r.contract }),
    });
}, updateApprenticeshipContractSchema));

documentRouter.delete("/document-apprenticeship-contracts/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.deleteApprenticeshipContract(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Apprenticeship contract not found" },
        file_document_is_valid: { blocked: { type: "Operation", reason: "Associated file document is validated" } },
        document_apprenticeship_contract_deleted_with_warnings: (r) => storageCleanupWarning("Apprenticeship contract deleted", r.failedPaths),
        document_apprenticeship_contract_deleted: { status: 200, body: { message: "Apprenticeship contract deleted" } },
    });
}));
