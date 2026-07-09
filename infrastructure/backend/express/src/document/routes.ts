import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { documentUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";
import { storageCleanupWarning } from "@express/src/storage/storage-warning";

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
        missing_fields: { status: 400, error: "fileDocumentId and type are required" },
        file_document_type_conflict: { blocked: { type: "Operation", reason: "File document is already linked to another document type" } },
        document_administrative_created: (r) => ({ status: 201, body: r.document }),
    });
}));

documentRouter.patch("/document-administratives/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.updateAdministrative(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Document administrative not found" },
        document_administrative_updated: (r) => ({ status: 200, body: r.document }),
    });
}));

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
        missing_fields: { status: 400, error: "fileDocumentId, type, startDate and endDate are required" },
        contract_already_exists: { blocked: { type: "Creation", reason: "An apprenticeship contract already exists for this file document" } },
        file_document_type_conflict: { blocked: { type: "Operation", reason: "File document is already linked to another document type" } },
        document_apprenticeship_contract_created: (r) => ({ status: 201, body: r.contract }),
    });
}));

documentRouter.patch("/document-apprenticeship-contracts/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.updateApprenticeshipContract(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Apprenticeship contract not found" },
        document_apprenticeship_contract_updated: (r) => ({ status: 200, body: r.contract }),
    });
}));

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
