import { randomUUID } from "node:crypto";
import { type DocumentAdministrative } from "@domain/document/document-administrative/document-administrative.entity";
import { type DocumentType } from "@domain/document/document-administrative/document-administrative.enums";
import { type DocumentApprenticeshipContract } from "@domain/document/document-apprenticeship-contract/document-apprenticeship-contract.entity";
import { type DocumentApprenticeshipContractType } from "@domain/document/document-apprenticeship-contract/document-apprenticeship-contract.enums";
import { type DocumentAdministrativeRepository } from "@application/document/document-administrative/document-administrative.repository";
import { type DocumentApprenticeshipContractRepository } from "@application/document/document-apprenticeship-contract/document-apprenticeship-contract.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type DocumentAdministrativeView = {
    id: string;
    fileDocumentId: string;
    type: DocumentType;
    expiration: string | null;
};

export type DocumentApprenticeshipContractView = {
    id: string;
    fileDocumentId: string;
    companyId: string;
    type: DocumentApprenticeshipContractType;
    startDate: string;
    endDate: string;
};

export type CreateDocumentAdministrativeResult =
    | MissingFields
    | { kind: "document_administrative_created"; document: DocumentAdministrativeView };

export type UpdateDocumentAdministrativeResult =
    | NotFound
    | { kind: "document_administrative_updated"; document: DocumentAdministrativeView };

export type DeleteDocumentAdministrativeResult =
    | NotFound
    | { kind: "document_administrative_deleted" };

export type GetDocumentAdministrativeResult =
    | NotFound
    | { kind: "document_administrative_found"; document: DocumentAdministrativeView };

export type ListDocumentAdministrativesResult = {
    kind: "document_administratives_listed";
    documents: DocumentAdministrativeView[];
};

export type CreateDocumentApprenticeshipContractResult =
    | MissingFields
    | { kind: "contract_already_exists" }
    | { kind: "document_apprenticeship_contract_created"; contract: DocumentApprenticeshipContractView };

export type UpdateDocumentApprenticeshipContractResult =
    | NotFound
    | { kind: "document_apprenticeship_contract_updated"; contract: DocumentApprenticeshipContractView };

export type DeleteDocumentApprenticeshipContractResult =
    | NotFound
    | { kind: "document_apprenticeship_contract_deleted" };

export type GetDocumentApprenticeshipContractResult =
    | NotFound
    | { kind: "document_apprenticeship_contract_found"; contract: DocumentApprenticeshipContractView };

export type ListDocumentApprenticeshipContractsResult = {
    kind: "document_apprenticeship_contracts_listed";
    contracts: DocumentApprenticeshipContractView[];
};

const toDocumentAdministrativeView = (d: DocumentAdministrative): DocumentAdministrativeView => ({
    id: d.id,
    fileDocumentId: d.fileDocumentId,
    type: d.type,
    expiration: d.expiration ? d.expiration.toISOString() : null,
});

const toDocumentApprenticeshipContractView = (
    d: DocumentApprenticeshipContract,
): DocumentApprenticeshipContractView => ({
    id: d.id,
    fileDocumentId: d.fileDocumentId,
    companyId: d.companyId,
    type: d.type,
    startDate: d.startDate.toISOString(),
    endDate: d.endDate.toISOString(),
});

export class DocumentUseCases {
    constructor(
        private readonly documentAdministratives: DocumentAdministrativeRepository,
        private readonly documentApprenticeshipContracts: DocumentApprenticeshipContractRepository,
    ) {}

    async createAdministrative(input: {
        fileDocumentId?: string;
        type?: DocumentType;
        expiration?: string | null;
    }): Promise<CreateDocumentAdministrativeResult> {
        const { fileDocumentId, type, expiration } = input;
        if (!fileDocumentId || !type) return MissingFields;
        const entry: DocumentAdministrative = {
            id: randomUUID(),
            fileDocumentId,
            type,
            expiration: expiration ? new Date(expiration) : null,
        };
        await this.documentAdministratives.save(entry);
        return { kind: "document_administrative_created", document: toDocumentAdministrativeView(entry) };
    }

    async updateAdministrative(
        id: string,
        input: { type?: DocumentType; expiration?: string | null },
    ): Promise<UpdateDocumentAdministrativeResult> {
        const entry = await this.documentAdministratives.findById(id);
        if (!entry) return NotFound;
        if (input.type !== undefined) entry.type = input.type;
        if (input.expiration !== undefined) entry.expiration = input.expiration ? new Date(input.expiration) : null;
        await this.documentAdministratives.save(entry);
        return { kind: "document_administrative_updated", document: toDocumentAdministrativeView(entry) };
    }

    async deleteAdministrative(id: string): Promise<DeleteDocumentAdministrativeResult> {
        const entry = await this.documentAdministratives.findById(id);
        if (!entry) return NotFound;
        await this.documentAdministratives.deleteById(id);
        return { kind: "document_administrative_deleted" };
    }

    async findAdministrativeById(id: string): Promise<GetDocumentAdministrativeResult> {
        const entry = await this.documentAdministratives.findById(id);
        if (!entry) return NotFound;
        return { kind: "document_administrative_found", document: toDocumentAdministrativeView(entry) };
    }

    async listAdministratives(): Promise<ListDocumentAdministrativesResult> {
        const entries = await this.documentAdministratives.list();
        return {
            kind: "document_administratives_listed",
            documents: entries.map(toDocumentAdministrativeView),
        };
    }

    async findAdministrativeByFileDocument(fileDocumentId: string): Promise<GetDocumentAdministrativeResult> {
        const entry = await this.documentAdministratives.findByFileDocumentId(fileDocumentId);
        if (!entry) return NotFound;
        return { kind: "document_administrative_found", document: toDocumentAdministrativeView(entry) };
    }

    async createApprenticeshipContract(input: {
        fileDocumentId?: string;
        companyId?: string;
        type?: DocumentApprenticeshipContractType;
        startDate?: string;
        endDate?: string;
    }): Promise<CreateDocumentApprenticeshipContractResult> {
        const { fileDocumentId, companyId, type, startDate, endDate } = input;
        if (!fileDocumentId || !companyId || !type || !startDate || !endDate)
            return MissingFields;
        if (await this.documentApprenticeshipContracts.findByFileDocument(fileDocumentId)) return { kind: "contract_already_exists" };
        const entry: DocumentApprenticeshipContract = {
            id: randomUUID(),
            fileDocumentId,
            companyId,
            type,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        };
        await this.documentApprenticeshipContracts.save(entry);
        return {
            kind: "document_apprenticeship_contract_created",
            contract: toDocumentApprenticeshipContractView(entry),
        };
    }

    async updateApprenticeshipContract(
        id: string,
        input: { companyId?: string; type?: DocumentApprenticeshipContractType; startDate?: string; endDate?: string },
    ): Promise<UpdateDocumentApprenticeshipContractResult> {
        const entry = await this.documentApprenticeshipContracts.findById(id);
        if (!entry) return NotFound;
        if (input.companyId !== undefined) entry.companyId = input.companyId;
        if (input.type !== undefined) entry.type = input.type;
        if (input.startDate !== undefined) entry.startDate = new Date(input.startDate);
        if (input.endDate !== undefined) entry.endDate = new Date(input.endDate);
        await this.documentApprenticeshipContracts.save(entry);
        return {
            kind: "document_apprenticeship_contract_updated",
            contract: toDocumentApprenticeshipContractView(entry),
        };
    }

    async deleteApprenticeshipContract(id: string): Promise<DeleteDocumentApprenticeshipContractResult> {
        const entry = await this.documentApprenticeshipContracts.findById(id);
        if (!entry) return NotFound;
        await this.documentApprenticeshipContracts.deleteById(id);
        return { kind: "document_apprenticeship_contract_deleted" };
    }

    async findApprenticeshipContractById(id: string): Promise<GetDocumentApprenticeshipContractResult> {
        const entry = await this.documentApprenticeshipContracts.findById(id);
        if (!entry) return NotFound;
        return {
            kind: "document_apprenticeship_contract_found",
            contract: toDocumentApprenticeshipContractView(entry),
        };
    }

    async listApprenticeshipContracts(): Promise<ListDocumentApprenticeshipContractsResult> {
        const entries = await this.documentApprenticeshipContracts.list();
        return {
            kind: "document_apprenticeship_contracts_listed",
            contracts: entries.map(toDocumentApprenticeshipContractView),
        };
    }

    async listApprenticeshipContractsByCompany(
        companyId: string,
    ): Promise<ListDocumentApprenticeshipContractsResult> {
        const entries = await this.documentApprenticeshipContracts.findByCompanyId(companyId);
        return {
            kind: "document_apprenticeship_contracts_listed",
            contracts: entries.map(toDocumentApprenticeshipContractView),
        };
    }

    async findApprenticeshipContractByFileDocument(
        fileDocumentId: string,
    ): Promise<GetDocumentApprenticeshipContractResult> {
        const entry = await this.documentApprenticeshipContracts.findByFileDocumentId(fileDocumentId);
        if (!entry) return NotFound;
        return {
            kind: "document_apprenticeship_contract_found",
            contract: toDocumentApprenticeshipContractView(entry),
        };
    }
}
