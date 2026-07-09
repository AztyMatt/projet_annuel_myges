import { randomUUID } from "node:crypto";
import { type DocumentAdministrative } from "@domain/document/document-administrative/document-administrative.entity";
import { type DocumentType } from "@domain/document/document-administrative/document-administrative.enums";
import { type DocumentApprenticeshipContract } from "@domain/document/document-apprenticeship-contract/document-apprenticeship-contract.entity";
import { type DocumentApprenticeshipContractType } from "@domain/document/document-apprenticeship-contract/document-apprenticeship-contract.enums";
import { DocumentStatus } from "@domain/file/file-document/file-document.enums";
import { type DocumentAdministrativeRepository } from "@application/document/document-administrative/document-administrative.repository";
import { type DocumentApprenticeshipContractRepository } from "@application/document/document-apprenticeship-contract/document-apprenticeship-contract.repository";
import { type FileDocumentRepository } from "@application/file/file-document/file-document.repository";
import { type FileRepository } from "@application/file/file.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type StorageService } from "@application/file/storage.service";
import { type UnitOfWork } from "@application/types/unit-of-work";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, MissingFields, Forbidden } from "@application/types/results";
import { isFileOwner } from "@application/file/file-access";

export type DocumentAdministrativeView = {
    id: string;
    fileDocumentId: string;
    type: DocumentType;
    expiration: string | null;
};

export type DocumentApprenticeshipContractView = {
    id: string;
    fileDocumentId: string;
    companyId: string | null;
    type: DocumentApprenticeshipContractType;
    startDate: string;
    endDate: string;
};

export type CreateDocumentAdministrativeResult =
    | MissingFields
    | Forbidden
    | { kind: "file_document_type_conflict" }
    | { kind: "document_administrative_created"; document: DocumentAdministrativeView };

export type UpdateDocumentAdministrativeResult =
    | NotFound
    | Forbidden
    | { kind: "document_administrative_updated"; document: DocumentAdministrativeView };

export type GetDocumentAdministrativeResult =
    | NotFound
    | { kind: "document_administrative_found"; document: DocumentAdministrativeView };

export type ListDocumentAdministrativesResult = Forbidden | {
    kind: "document_administratives_listed";
    documents: DocumentAdministrativeView[];
};

export type CreateDocumentApprenticeshipContractResult =
    | MissingFields
    | Forbidden
    | { kind: "contract_already_exists" }
    | { kind: "file_document_type_conflict" }
    | { kind: "document_apprenticeship_contract_created"; contract: DocumentApprenticeshipContractView };

export type UpdateDocumentApprenticeshipContractResult =
    | NotFound
    | Forbidden
    | { kind: "document_apprenticeship_contract_updated"; contract: DocumentApprenticeshipContractView };

export type GetDocumentApprenticeshipContractResult =
    | NotFound
    | { kind: "document_apprenticeship_contract_found"; contract: DocumentApprenticeshipContractView };

export type ListDocumentApprenticeshipContractsResult = Forbidden | {
    kind: "document_apprenticeship_contracts_listed";
    contracts: DocumentApprenticeshipContractView[];
};

export type DeleteDocumentAdministrativeResult =
    | NotFound
    | Forbidden
    | { kind: "file_document_is_valid" }
    | { kind: "document_administrative_deleted" }
    | { kind: "document_administrative_deleted_with_warnings"; failedPaths: string[] };

export type DeleteDocumentApprenticeshipContractResult =
    | NotFound
    | Forbidden
    | { kind: "file_document_is_valid" }
    | { kind: "document_apprenticeship_contract_deleted" }
    | { kind: "document_apprenticeship_contract_deleted_with_warnings"; failedPaths: string[] };

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

type DeleteDocTypeOutcome =
    | { kind: "deleted" }
    | { kind: "deleted_with_warnings"; failedPaths: string[] };

export class DocumentUseCases {
    constructor(
        private readonly documentAdministratives: DocumentAdministrativeRepository,
        private readonly documentApprenticeshipContracts: DocumentApprenticeshipContractRepository,
        private readonly fileDocuments: FileDocumentRepository,
        private readonly files: FileRepository,
        private readonly storage: StorageService,
        private readonly unitOfWork: UnitOfWork,
        private readonly students: StudentRepository,
    ) {}

    private async authorizeDocTypeCreation(
        fileDocumentId: string,
        auth: AuthContext,
    ): Promise<{ kind: "ok" } | Forbidden> {
        if (auth.isAdmin) return { kind: "ok" };
        const fileDocument = await this.fileDocuments.findById(fileDocumentId);
        if (!fileDocument) return Forbidden;
        const file = await this.files.findById(fileDocument.fileId);
        if (!isFileOwner(file, auth)) return Forbidden;
        return { kind: "ok" };
    }

    private async authorizeDocTypeDeletion(
        fileDocumentId: string,
        auth: AuthContext,
    ): Promise<{ kind: "ok" } | Forbidden | { kind: "file_document_is_valid" }> {
        if (auth.isAdmin) return { kind: "ok" };
        const fileDocument = await this.fileDocuments.findById(fileDocumentId);
        if (!fileDocument) return Forbidden;
        const file = await this.files.findById(fileDocument.fileId);
        if (!isFileOwner(file, auth)) return Forbidden;
        if (fileDocument.status === DocumentStatus.VALID) return { kind: "file_document_is_valid" };
        return { kind: "ok" };
    }

    private async deleteDocTypeWithFile(
        fileDocumentId: string,
        deleteDocType: () => Promise<void>,
    ): Promise<DeleteDocTypeOutcome> {
        const fileDocument = await this.fileDocuments.findById(fileDocumentId);
        if (!fileDocument) {
            await deleteDocType();
            return { kind: "deleted" };
        }
        const file = await this.files.findById(fileDocument.fileId);
        await this.unitOfWork.run(async () => {
            await deleteDocType();
            await this.fileDocuments.deleteById(fileDocument.id);
            if (file) await this.files.deleteById(file.id);
        });
        const failedPaths = file ? await this.storage.deleteMany([file.storagePath]) : [];
        return failedPaths.length > 0
            ? { kind: "deleted_with_warnings", failedPaths }
            : { kind: "deleted" };
    }

    async createAdministrative(input: {
        fileDocumentId?: string;
        type?: DocumentType;
        expiration?: string | null;
    }, auth: AuthContext): Promise<CreateDocumentAdministrativeResult> {
        const { fileDocumentId, type, expiration } = input;
        if (!fileDocumentId || !type) return MissingFields;
        const authResult = await this.authorizeDocTypeCreation(fileDocumentId, auth);
        if (authResult.kind !== "ok") return Forbidden;
        const [existingAdmin, existingContract] = await Promise.all([
            this.documentAdministratives.findByFileDocumentId(fileDocumentId),
            this.documentApprenticeshipContracts.findByFileDocumentId(fileDocumentId),
        ]);
        if (existingAdmin || existingContract) return { kind: "file_document_type_conflict" };
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
        auth: AuthContext,
    ): Promise<UpdateDocumentAdministrativeResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.documentAdministratives.findById(id);
        if (!entry) return NotFound;
        if (input.type !== undefined) entry.type = input.type;
        if (input.expiration !== undefined) entry.expiration = input.expiration ? new Date(input.expiration) : null;
        await this.documentAdministratives.save(entry);
        return { kind: "document_administrative_updated", document: toDocumentAdministrativeView(entry) };
    }

    async findAdministrativeById(id: string, auth: AuthContext): Promise<GetDocumentAdministrativeResult> {
        if (!auth.isAdmin) return NotFound;
        const entry = await this.documentAdministratives.findById(id);
        if (!entry) return NotFound;
        return { kind: "document_administrative_found", document: toDocumentAdministrativeView(entry) };
    }

    async listMineAdministrative(auth: AuthContext): Promise<NotFound | { kind: "document_administratives_listed"; documents: DocumentAdministrativeView[] }> {
        const student = await this.students.findByUserId(auth.requesterId);
        if (!student) return NotFound;
        const docs = await this.documentAdministratives.findByStudentId(student.id);
        return { kind: "document_administratives_listed", documents: docs.map(toDocumentAdministrativeView) };
    }

    async listAdministratives(auth: AuthContext): Promise<ListDocumentAdministrativesResult> {
        if (!auth.isAdmin) return Forbidden;
        const entries = await this.documentAdministratives.list();
        return { kind: "document_administratives_listed", documents: entries.map(toDocumentAdministrativeView) };
    }

    async findAdministrativeByFileDocument(fileDocumentId: string, auth: AuthContext): Promise<GetDocumentAdministrativeResult> {
        if (!auth.isAdmin) return NotFound;
        const entry = await this.documentAdministratives.findByFileDocumentId(fileDocumentId);
        if (!entry) return NotFound;
        return { kind: "document_administrative_found", document: toDocumentAdministrativeView(entry) };
    }

    async createApprenticeshipContract(input: {
        fileDocumentId?: string;
        companyId?: string | null;
        type?: DocumentApprenticeshipContractType;
        startDate?: string;
        endDate?: string;
    }, auth: AuthContext): Promise<CreateDocumentApprenticeshipContractResult> {
        const { fileDocumentId, companyId, type, startDate, endDate } = input;
        if (!fileDocumentId || !type || !startDate || !endDate) return MissingFields;
        const authResult = await this.authorizeDocTypeCreation(fileDocumentId, auth);
        if (authResult.kind !== "ok") return Forbidden;
        if (await this.documentApprenticeshipContracts.findByFileDocumentId(fileDocumentId)) return { kind: "contract_already_exists" };
        if (await this.documentAdministratives.findByFileDocumentId(fileDocumentId)) return { kind: "file_document_type_conflict" };
        const entry: DocumentApprenticeshipContract = {
            id: randomUUID(),
            fileDocumentId,
            companyId: companyId ?? null,
            type,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        };
        await this.documentApprenticeshipContracts.save(entry);
        return { kind: "document_apprenticeship_contract_created", contract: toDocumentApprenticeshipContractView(entry) };
    }

    async updateApprenticeshipContract(
        id: string,
        input: { companyId?: string | null; type?: DocumentApprenticeshipContractType; startDate?: string; endDate?: string },
        auth: AuthContext,
    ): Promise<UpdateDocumentApprenticeshipContractResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.documentApprenticeshipContracts.findById(id);
        if (!entry) return NotFound;
        if (input.companyId !== undefined) entry.companyId = input.companyId;
        if (input.type !== undefined) entry.type = input.type;
        if (input.startDate !== undefined) entry.startDate = new Date(input.startDate);
        if (input.endDate !== undefined) entry.endDate = new Date(input.endDate);
        await this.documentApprenticeshipContracts.save(entry);
        return { kind: "document_apprenticeship_contract_updated", contract: toDocumentApprenticeshipContractView(entry) };
    }

    async findApprenticeshipContractById(id: string, auth: AuthContext): Promise<GetDocumentApprenticeshipContractResult> {
        if (!auth.isAdmin) return NotFound;
        const entry = await this.documentApprenticeshipContracts.findById(id);
        if (!entry) return NotFound;
        return { kind: "document_apprenticeship_contract_found", contract: toDocumentApprenticeshipContractView(entry) };
    }

    async listMineApprenticeshipContracts(auth: AuthContext): Promise<NotFound | { kind: "document_apprenticeship_contracts_listed"; contracts: DocumentApprenticeshipContractView[] }> {
        const student = await this.students.findByUserId(auth.requesterId);
        if (!student) return NotFound;
        const contracts = await this.documentApprenticeshipContracts.findByStudentId(student.id);
        return { kind: "document_apprenticeship_contracts_listed", contracts: contracts.map(toDocumentApprenticeshipContractView) };
    }

    async listApprenticeshipContracts(auth: AuthContext): Promise<ListDocumentApprenticeshipContractsResult> {
        if (!auth.isAdmin) return Forbidden;
        const entries = await this.documentApprenticeshipContracts.list();
        return { kind: "document_apprenticeship_contracts_listed", contracts: entries.map(toDocumentApprenticeshipContractView) };
    }

    async listApprenticeshipContractsByCompany(companyId: string, auth: AuthContext): Promise<NotFound | { kind: "document_apprenticeship_contracts_listed"; contracts: DocumentApprenticeshipContractView[] }> {
        if (!auth.isAdmin) return NotFound;
        const entries = await this.documentApprenticeshipContracts.findByCompanyId(companyId);
        return { kind: "document_apprenticeship_contracts_listed", contracts: entries.map(toDocumentApprenticeshipContractView) };
    }

    async findApprenticeshipContractByFileDocument(fileDocumentId: string, auth: AuthContext): Promise<GetDocumentApprenticeshipContractResult> {
        if (!auth.isAdmin) return NotFound;
        const entry = await this.documentApprenticeshipContracts.findByFileDocumentId(fileDocumentId);
        if (!entry) return NotFound;
        return { kind: "document_apprenticeship_contract_found", contract: toDocumentApprenticeshipContractView(entry) };
    }

    async deleteAdministrative(id: string, auth: AuthContext): Promise<DeleteDocumentAdministrativeResult> {
        const entry = await this.documentAdministratives.findById(id);
        if (!entry) return NotFound;
        const authResult = await this.authorizeDocTypeDeletion(entry.fileDocumentId, auth);
        if (authResult.kind === "forbidden") return Forbidden;
        if (authResult.kind === "file_document_is_valid") return { kind: "file_document_is_valid" };
        const outcome = await this.deleteDocTypeWithFile(entry.fileDocumentId, () => this.documentAdministratives.deleteById(id));
        return outcome.kind === "deleted"
            ? { kind: "document_administrative_deleted" }
            : { kind: "document_administrative_deleted_with_warnings", failedPaths: outcome.failedPaths };
    }

    async deleteApprenticeshipContract(id: string, auth: AuthContext): Promise<DeleteDocumentApprenticeshipContractResult> {
        const entry = await this.documentApprenticeshipContracts.findById(id);
        if (!entry) return NotFound;
        const authResult = await this.authorizeDocTypeDeletion(entry.fileDocumentId, auth);
        if (authResult.kind === "forbidden") return Forbidden;
        if (authResult.kind === "file_document_is_valid") return { kind: "file_document_is_valid" };
        const outcome = await this.deleteDocTypeWithFile(entry.fileDocumentId, () => this.documentApprenticeshipContracts.deleteById(id));
        return outcome.kind === "deleted"
            ? { kind: "document_apprenticeship_contract_deleted" }
            : { kind: "document_apprenticeship_contract_deleted_with_warnings", failedPaths: outcome.failedPaths };
    }
}
