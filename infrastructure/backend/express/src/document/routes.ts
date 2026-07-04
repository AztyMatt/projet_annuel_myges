import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { documentUseCases } from "@express/src/container";

export const documentRouter = Router();

// document-administrative routes
documentRouter.get(
    "/document-administratives",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (_req, res) => {
        const result = await documentUseCases.listAdministratives();
        res.status(200).json(result.documents);
    },
);

documentRouter.get(
    "/document-administratives/file-document/:fileDocumentId",
    requireAuth,
    async (req, res) => {
        const result = await documentUseCases.findAdministrativeByFileDocument(
            String(req.params.fileDocumentId),
        );
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Document administrative not found" });
        res.status(200).json(result.document);
    },
);

documentRouter.get("/document-administratives/:id", requireAuth, async (req, res) => {
    const result = await documentUseCases.findAdministrativeById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "Document administrative not found" });
    res.status(200).json(result.document);
});

documentRouter.post(
    "/document-administratives",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await documentUseCases.createAdministrative(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "fileDocumentId and type are required" });
        res.status(201).json(result.document);
    },
);

documentRouter.patch(
    "/document-administratives/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await documentUseCases.updateAdministrative(String(req.params.id), req.body);
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Document administrative not found" });
        res.status(200).json(result.document);
    },
);

documentRouter.delete(
    "/document-administratives/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await documentUseCases.deleteAdministrative(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Document administrative not found" });
        res.status(200).json({ message: "Document administrative deleted" });
    },
);

// document-apprenticeship-contract routes
documentRouter.get(
    "/document-apprenticeship-contracts",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (_req, res) => {
        const result = await documentUseCases.listApprenticeshipContracts();
        res.status(200).json(result.contracts);
    },
);

documentRouter.get(
    "/document-apprenticeship-contracts/company/:companyId",
    requireAuth,
    async (req, res) => {
        const result = await documentUseCases.listApprenticeshipContractsByCompany(
            String(req.params.companyId),
        );
        res.status(200).json(result.contracts);
    },
);

documentRouter.get(
    "/document-apprenticeship-contracts/file-document/:fileDocumentId",
    requireAuth,
    async (req, res) => {
        const result = await documentUseCases.findApprenticeshipContractByFileDocument(
            String(req.params.fileDocumentId),
        );
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Apprenticeship contract not found" });
        res.status(200).json(result.contract);
    },
);

documentRouter.get(
    "/document-apprenticeship-contracts/:id",
    requireAuth,
    async (req, res) => {
        const result = await documentUseCases.findApprenticeshipContractById(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Apprenticeship contract not found" });
        res.status(200).json(result.contract);
    },
);

documentRouter.post(
    "/document-apprenticeship-contracts",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await documentUseCases.createApprenticeshipContract(req.body);
        if (result.kind === "missing_fields")
            return void res
                .status(400)
                .json({ error: "fileDocumentId, companyId, type, startDate and endDate are required" });
        if (result.kind === "contract_already_exists")
            return void res.status(409).json({ error: "An apprenticeship contract already exists for this file document" });
        res.status(201).json(result.contract);
    },
);

documentRouter.patch(
    "/document-apprenticeship-contracts/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await documentUseCases.updateApprenticeshipContract(String(req.params.id), req.body);
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Apprenticeship contract not found" });
        res.status(200).json(result.contract);
    },
);

documentRouter.delete(
    "/document-apprenticeship-contracts/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await documentUseCases.deleteApprenticeshipContract(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Apprenticeship contract not found" });
        res.status(200).json({ message: "Apprenticeship contract deleted" });
    },
);
