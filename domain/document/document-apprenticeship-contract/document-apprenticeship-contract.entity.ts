import { type DocumentApprenticeshipContractType } from "@domain/document/document-apprenticeship-contract/document-apprenticeship-contract.enums";

export type DocumentApprenticeshipContract = {
    id: string;
    fileDocumentId: string;
    companyId: string | null;
    type: DocumentApprenticeshipContractType;
    startDate: Date;
    endDate: Date;
};
