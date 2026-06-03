import { type DocumentAdministrative } from "../../../domain/document/document-administrative/document-administrative.entity"

export interface DocumentAdministrativeRepository {
  findById(id: string): Promise<DocumentAdministrative | undefined>
  findByFileDocumentId(fileDocumentId: string): Promise<DocumentAdministrative | undefined>
  save(document: DocumentAdministrative): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<DocumentAdministrative[]>
}
