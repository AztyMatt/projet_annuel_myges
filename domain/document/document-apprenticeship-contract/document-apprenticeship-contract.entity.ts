import { type DocumentApprenticeshipContractType } from "./document-apprenticeship-contract.enums"

export type DocumentApprenticeshipContract = {
  id: string
  fileDocumentId: string
  companyId: string
  type: DocumentApprenticeshipContractType
  startDate: Date
  endDate: Date
}
