import { and, eq } from "drizzle-orm";
import { type GradeManualNotationRepository } from "@application/grade/grade-manual-notation/grade-manual-notation.repository";
import { type GradeManualNotation } from "@domain/grade/grade-manual-notation/grade-manual-notation.entity";
import { db } from "@express/src/postgres/db";
import { gradeManualNotation as gradeManualNotationTable } from "@express/src/postgres/schema/grade";

function rowToGradeManualNotation(row: typeof gradeManualNotationTable.$inferSelect): GradeManualNotation {
    return {
        id: row.id,
        gradeId: row.gradeId,
        gradeManualId: row.gradeManualId,
    };
}

export const gradeManualNotationRepository: GradeManualNotationRepository = {
    async findById(id) {
        const result = await db
            .select()
            .from(gradeManualNotationTable)
            .where(eq(gradeManualNotationTable.id, id))
            .limit(1);
        return result[0] ? rowToGradeManualNotation(result[0]) : undefined;
    },
    async findByGradeId(gradeId) {
        const result = await db
            .select()
            .from(gradeManualNotationTable)
            .where(eq(gradeManualNotationTable.gradeId, gradeId));
        return result.map(rowToGradeManualNotation);
    },
    async findByGradeManualId(gradeManualId) {
        const result = await db
            .select()
            .from(gradeManualNotationTable)
            .where(eq(gradeManualNotationTable.gradeManualId, gradeManualId));
        return result.map(rowToGradeManualNotation);
    },
    async findByGradeAndManualNotation(gradeId, gradeManualId) {
        const result = await db
            .select()
            .from(gradeManualNotationTable)
            .where(and(eq(gradeManualNotationTable.gradeId, gradeId), eq(gradeManualNotationTable.gradeManualId, gradeManualId)))
            .limit(1);
        return result[0] ? rowToGradeManualNotation(result[0]) : undefined;
    },
    async save(gradeManualNotation) {
        await db
            .insert(gradeManualNotationTable)
            .values({
                id: gradeManualNotation.id,
                gradeId: gradeManualNotation.gradeId,
                gradeManualId: gradeManualNotation.gradeManualId,
            })
            .onConflictDoUpdate({
                target: gradeManualNotationTable.id,
                set: {
                    gradeId: gradeManualNotation.gradeId,
                    gradeManualId: gradeManualNotation.gradeManualId,
                },
            });
    },
    async deleteById(id) {
        await db.delete(gradeManualNotationTable).where(eq(gradeManualNotationTable.id, id));
    },
};
