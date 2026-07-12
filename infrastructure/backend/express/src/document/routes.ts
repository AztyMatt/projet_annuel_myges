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
        not_found: { status: 404, error: "Document administratif introuvable" },
        document_administrative_found: (r) => ({ status: 200, body: r.document }),
    });
}));

documentRouter.get("/document-administratives/mine", ...authed(async (req, res) => {
    const result = await documentUseCases.listMineAdministrative(getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Profil étudiant introuvable" },
        document_administratives_listed: (r) => ({ status: 200, body: r.documents }),
    });
}));

documentRouter.get("/document-administratives/:id", ...authed(async (req, res) => {
    const result = await documentUseCases.findAdministrativeById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Document administratif introuvable" },
        document_administrative_found: (r) => ({ status: 200, body: r.document }),
    });
}));

documentRouter.post("/document-administratives", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.createAdministrative(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Fichier introuvable" },
        administrative_already_exists: { blocked: { type: "Creation", reason: "Un document administratif existe déjà pour ce fichier" } },
        file_document_type_conflict: { blocked: { type: "Creation", reason: "Le fichier est déjà lié à un autre type de document" } },
        file_too_large: { status: 400, error: "Le fichier dépasse la taille maximale autorisée pour ce type de document" },
        mime_type_not_allowed: { status: 400, error: "Ce type de fichier n'est pas autorisé pour ce type de document" },
        document_administrative_created: (r) => ({ status: 201, body: r.document }),
    });
}, createAdministrativeSchema));

documentRouter.patch("/document-administratives/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.updateAdministrative(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Document administratif introuvable" },
        file_too_large: { status: 400, error: "Le fichier dépasse la taille maximale autorisée pour ce type de document" },
        mime_type_not_allowed: { status: 400, error: "Ce type de fichier n'est pas autorisé pour ce type de document" },
        valid_document_of_type_exists: { blocked: { type: "Operation", reason: "Cet étudiant a déjà un document valide de ce type" } },
        document_administrative_updated: (r) => ({ status: 200, body: r.document }),
    });
}, updateAdministrativeSchema));

documentRouter.delete("/document-administratives/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.deleteAdministrative(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Document administratif introuvable" },
        file_document_is_valid: { blocked: { type: "Operation", reason: "Le fichier associé est validé" } },
        document_administrative_deleted_with_warnings: (r) => storageCleanupWarning("Document administratif supprimé", r.failedPaths),
        document_administrative_deleted: { status: 200, body: { message: "Document administratif supprimé" } },
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
        not_found: { status: 404, error: "Contrats d'alternance introuvables" },
        document_apprenticeship_contracts_listed: (r) => ({ status: 200, body: r.contracts }),
    });
}));

documentRouter.get("/document-apprenticeship-contracts/file-document/:fileDocumentId", ...authed(async (req, res) => {
    const result = await documentUseCases.findApprenticeshipContractByFileDocument(String(req.params.fileDocumentId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Contrat d'alternance introuvable" },
        document_apprenticeship_contract_found: (r) => ({ status: 200, body: r.contract }),
    });
}));

documentRouter.get("/document-apprenticeship-contracts/mine", ...authed(async (req, res) => {
    const result = await documentUseCases.listMineApprenticeshipContracts(getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Profil étudiant introuvable" },
        document_apprenticeship_contracts_listed: (r) => ({ status: 200, body: r.contracts }),
    });
}));

documentRouter.get("/document-apprenticeship-contracts/:id", ...authed(async (req, res) => {
    const result = await documentUseCases.findApprenticeshipContractById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Contrat d'alternance introuvable" },
        document_apprenticeship_contract_found: (r) => ({ status: 200, body: r.contract }),
    });
}));

documentRouter.post("/document-apprenticeship-contracts", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.createApprenticeshipContract(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Fichier introuvable" },
        invalid_date_range: { status: 400, error: "startDate doit être antérieure à endDate" },
        company_not_found: { status: 404, error: "Entreprise introuvable" },
        contract_already_exists: { blocked: { type: "Creation", reason: "Un contrat d'alternance existe déjà pour ce fichier" } },
        file_document_type_conflict: { blocked: { type: "Creation", reason: "Le fichier est déjà lié à un autre type de document" } },
        file_too_large: { status: 400, error: "Le fichier dépasse la taille maximale autorisée pour ce type de document" },
        mime_type_not_allowed: { status: 400, error: "Ce type de fichier n'est pas autorisé pour ce type de document" },
        document_apprenticeship_contract_created: (r) => ({ status: 201, body: r.contract }),
    });
}, createApprenticeshipContractSchema));

documentRouter.patch("/document-apprenticeship-contracts/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.updateApprenticeshipContract(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Contrat d'alternance introuvable" },
        invalid_date_range: { status: 400, error: "startDate doit être antérieure à endDate" },
        company_not_found: { status: 404, error: "Entreprise introuvable" },
        valid_document_of_type_exists: { blocked: { type: "Operation", reason: "Cet étudiant a déjà un document valide de ce type" } },
        document_apprenticeship_contract_updated: (r) => ({ status: 200, body: r.contract }),
    });
}, updateApprenticeshipContractSchema));

documentRouter.delete("/document-apprenticeship-contracts/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await documentUseCases.deleteApprenticeshipContract(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Contrat d'alternance introuvable" },
        file_document_is_valid: { blocked: { type: "Operation", reason: "Le fichier associé est validé" } },
        document_apprenticeship_contract_deleted_with_warnings: (r) => storageCleanupWarning("Contrat d'alternance supprimé", r.failedPaths),
        document_apprenticeship_contract_deleted: { status: 200, body: { message: "Contrat d'alternance supprimé" } },
    });
}));
