import { desc, eq } from "drizzle-orm";
import { type AcademicYearRepository } from "@application/academic-year/academic-year.repository";
import { type AcademicYear } from "@domain/academic-year/academic-year.entity";
import { db } from "@express/src/postgres/db";
import { academicYear as academicYearTable } from "@express/src/postgres/schema/academic-year";

function rowToAcademicYear(row: typeof academicYearTable.$inferSelect): AcademicYear {
    return {
        id: row.id,
        startDate: row.startDate,
        endDate: row.endDate,
        isCurrent: row.isCurrent,
    };
}

export const academicYearRepository: AcademicYearRepository = {
    async findById(id) {
        const result = await db.select().from(academicYearTable).where(eq(academicYearTable.id, id)).limit(1);
        return result[0] ? rowToAcademicYear(result[0]) : undefined;
    },
    async findCurrent() {
        const result = await db.select().from(academicYearTable).where(eq(academicYearTable.isCurrent, true)).limit(1);
        return result[0] ? rowToAcademicYear(result[0]) : undefined;
    },
    async save(academicYear) {
        await db
            .insert(academicYearTable)
            .values({
                id: academicYear.id,
                startDate: academicYear.startDate,
                endDate: academicYear.endDate,
                isCurrent: academicYear.isCurrent,
            })
            .onConflictDoUpdate({
                target: academicYearTable.id,
                set: {
                    startDate: academicYear.startDate,
                    endDate: academicYear.endDate,
                    isCurrent: academicYear.isCurrent,
                },
            });
    },
    async deleteById(id) {
        await db.delete(academicYearTable).where(eq(academicYearTable.id, id));
    },
    async list() {
        const result = await db.select().from(academicYearTable).orderBy(desc(academicYearTable.startDate));
        return result.map(rowToAcademicYear);
    },
};
