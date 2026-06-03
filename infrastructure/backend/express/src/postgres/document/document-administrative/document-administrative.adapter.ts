import { eq } from "drizzle-orm"
import { type DocumentAdministrativeRepository } from "@application/document/document-administrative/document-administrative.repository"
import { type DocumentAdministrative } from "@domain/document/document-administrative/document-administrative.entity"
import { DocumentType } from "@domain/document/document-administrative/document-administrative.enums"
import { assertEnum } from "@express/src/postgres/assert-enum"
import { db } from "@express/src/postgres/db"
import { documentAdministrative as documentAdministrativeTable } from "@express/src/postgres/schema/document"

function rowToDocumentAdministrative(row: typeof documentAdministrativeTable.$inferSelect): DocumentAdministrative {
  return {
    id: row.id,
    fileDocumentId: row.fileDocumentId,
    type: assertEnum(row.type, DocumentType),
    expiration: row.expiration,
  }
}

export const documentAdministrativeRepository: DocumentAdministrativeRepository = {
  async findById(id) {
    const result = await db.select().from(documentAdministrativeTable).where(eq(documentAdministrativeTable.id, id)).limit(1)
    return result[0] ? rowToDocumentAdministrative(result[0]) : undefined
  },
  async findByFileDocumentId(fileDocumentId) {
    const result = await db.select().from(documentAdministrativeTable).where(eq(documentAdministrativeTable.fileDocumentId, fileDocumentId)).limit(1)
    return result[0] ? rowToDocumentAdministrative(result[0]) : undefined
  },
  async save(documentAdministrative) {
    await db
      .insert(documentAdministrativeTable)
      .values({
        id: documentAdministrative.id,
        fileDocumentId: documentAdministrative.fileDocumentId,
        type: documentAdministrative.type,
        expiration: documentAdministrative.expiration,
      })
      .onConflictDoUpdate({
        target: documentAdministrativeTable.id,
        set: {
          fileDocumentId: documentAdministrative.fileDocumentId,
          type: documentAdministrative.type,
          expiration: documentAdministrative.expiration,
        },
      })
  },
  async deleteById(id) {
    await db.delete(documentAdministrativeTable).where(eq(documentAdministrativeTable.id, id))
  },
  async list() {
    const result = await db.select().from(documentAdministrativeTable)
    return result.map(rowToDocumentAdministrative)
  },
}
