import { asc, eq } from "drizzle-orm";
import { type DocumentApprenticeshipContractRepository } from "@application/document/document-apprenticeship-contract/document-apprenticeship-contract.repository";
import { type DocumentApprenticeshipContract } from "@domain/document/document-apprenticeship-contract/document-apprenticeship-contract.entity";
import { DocumentApprenticeshipContractType } from "@domain/document/document-apprenticeship-contract/document-apprenticeship-contract.enums";
import { assertEnum } from "@express/src/postgres/assert-enum";
import { db } from "@express/src/postgres/db";
import { documentApprenticeshipContract as documentApprenticeshipContractTable } from "@express/src/postgres/schema/document";

function rowToDocumentApprenticeshipContract(
    row: typeof documentApprenticeshipContractTable.$inferSelect,
): DocumentApprenticeshipContract {
    return {
        id: row.id,
        fileDocumentId: row.fileDocumentId,
        companyId: row.companyId,
        type: assertEnum(row.type, DocumentApprenticeshipContractType),
        startDate: row.startDate,
        endDate: row.endDate,
    };
}

export const documentApprenticeshipContractRepository: DocumentApprenticeshipContractRepository = {
    async findById(id) {
        const result = await db
            .select()
            .from(documentApprenticeshipContractTable)
            .where(eq(documentApprenticeshipContractTable.id, id))
            .limit(1);
        return result[0] ? rowToDocumentApprenticeshipContract(result[0]) : undefined;
    },
    async findByFileDocumentId(fileDocumentId) {
        const result = await db
            .select()
            .from(documentApprenticeshipContractTable)
            .where(eq(documentApprenticeshipContractTable.fileDocumentId, fileDocumentId))
            .limit(1);
        return result[0] ? rowToDocumentApprenticeshipContract(result[0]) : undefined;
    },
    async findByCompanyId(companyId) {
        const result = await db
            .select()
            .from(documentApprenticeshipContractTable)
            .where(eq(documentApprenticeshipContractTable.companyId, companyId));
        return result.map(rowToDocumentApprenticeshipContract);
    },
    async save(documentApprenticeshipContract) {
        await db
            .insert(documentApprenticeshipContractTable)
            .values({
                id: documentApprenticeshipContract.id,
                fileDocumentId: documentApprenticeshipContract.fileDocumentId,
                companyId: documentApprenticeshipContract.companyId,
                type: documentApprenticeshipContract.type,
                startDate: documentApprenticeshipContract.startDate,
                endDate: documentApprenticeshipContract.endDate,
            })
            .onConflictDoUpdate({
                target: documentApprenticeshipContractTable.id,
                set: {
                    fileDocumentId: documentApprenticeshipContract.fileDocumentId,
                    companyId: documentApprenticeshipContract.companyId,
                    type: documentApprenticeshipContract.type,
                    startDate: documentApprenticeshipContract.startDate,
                    endDate: documentApprenticeshipContract.endDate,
                },
            });
    },
    async deleteById(id) {
        await db.delete(documentApprenticeshipContractTable).where(eq(documentApprenticeshipContractTable.id, id));
    },
    async list() {
        const result = await db
            .select()
            .from(documentApprenticeshipContractTable)
            .orderBy(asc(documentApprenticeshipContractTable.startDate));
        return result.map(rowToDocumentApprenticeshipContract);
    },
};
