import { type DocumentType } from "./document-administrative.enums"

export type DocumentAdministrative = {
  id: string
  fileDocumentId: string
  type: DocumentType
  expiration: Date | null
}
