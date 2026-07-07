import { type DocumentApprenticeshipContract } from "@domain/document/document-apprenticeship-contract/document-apprenticeship-contract.entity";

export interface DocumentApprenticeshipContractRepository {
    findById(id: string): Promise<DocumentApprenticeshipContract | undefined>;
    findByFileDocumentId(fileDocumentId: string): Promise<DocumentApprenticeshipContract | undefined>;
    findByCompanyId(companyId: string): Promise<DocumentApprenticeshipContract[]>;
    findByFileDocument(fileDocumentId: string): Promise<DocumentApprenticeshipContract | undefined>;
    save(contract: DocumentApprenticeshipContract): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<DocumentApprenticeshipContract[]>;
}
