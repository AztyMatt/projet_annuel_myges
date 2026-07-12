import { and, asc, eq } from "drizzle-orm";
import { type ManualNotationRepository } from "@application/grade/grade-manual-notation/manual-notation/manual-notation.repository";
import { type ManualNotation } from "@domain/grade/grade-manual-notation/manual-notation/manual-notation.entity";
import { db } from "@express/src/postgres/db";
import { manualNotation as manualNotationTable } from "@express/src/postgres/schema/grade";

function rowToManualNotation(row: typeof manualNotationTable.$inferSelect): ManualNotation {
    return {
        id: row.id,
        moduleId: row.moduleId,
        name: row.name,
    };
}

export const manualNotationRepository: ManualNotationRepository = {
    async findById(id) {
        const result = await db.select().from(manualNotationTable).where(eq(manualNotationTable.id, id)).limit(1);
        return result[0] ? rowToManualNotation(result[0]) : undefined;
    },
    async findByModuleId(moduleId) {
        const result = await db.select().from(manualNotationTable).where(eq(manualNotationTable.moduleId, moduleId));
        return result.map(rowToManualNotation);
    },
    async existsByModuleId(moduleId) {
        const rows = await db.select({ id: manualNotationTable.id }).from(manualNotationTable).where(eq(manualNotationTable.moduleId, moduleId)).limit(1);
        return rows.length > 0;
    },
    async findByModuleAndName(moduleId, name) {
        const result = await db
            .select()
            .from(manualNotationTable)
            .where(and(eq(manualNotationTable.moduleId, moduleId), eq(manualNotationTable.name, name)))
            .limit(1);
        return result[0] ? rowToManualNotation(result[0]) : undefined;
    },
    async save(manualNotation) {
        await db
            .insert(manualNotationTable)
            .values({
                id: manualNotation.id,
                moduleId: manualNotation.moduleId,
                name: manualNotation.name,
            })
            .onConflictDoUpdate({
                target: manualNotationTable.id,
                set: {
                    moduleId: manualNotation.moduleId,
                    name: manualNotation.name,
                },
            });
    },
    async deleteById(id) {
        await db.delete(manualNotationTable).where(eq(manualNotationTable.id, id));
    },
    async list() {
        const result = await db.select().from(manualNotationTable).orderBy(asc(manualNotationTable.name));
        return result.map(rowToManualNotation);
    },
};
