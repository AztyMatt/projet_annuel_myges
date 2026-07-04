import { and, asc, eq } from "drizzle-orm";
import { type BlocRepository } from "@application/bloc/bloc.repository";
import { type Bloc } from "@domain/bloc/bloc.entity";
import { db } from "@express/src/postgres/db";
import { bloc as blocTable } from "@express/src/postgres/schema/bloc";

function rowToBloc(row: typeof blocTable.$inferSelect): Bloc {
    return {
        id: row.id,
        name: row.name,
        programId: row.programId,
    };
}

export const blocRepository: BlocRepository = {
    async findById(id) {
        const result = await db.select().from(blocTable).where(eq(blocTable.id, id)).limit(1);
        return result[0] ? rowToBloc(result[0]) : undefined;
    },
    async findByProgramId(programId) {
        const result = await db.select().from(blocTable).where(eq(blocTable.programId, programId));
        return result.map(rowToBloc);
    },
    async findByProgramAndName(programId, name) {
        const result = await db
            .select()
            .from(blocTable)
            .where(and(eq(blocTable.programId, programId), eq(blocTable.name, name)))
            .limit(1);
        return result[0] ? rowToBloc(result[0]) : undefined;
    },
    async save(bloc) {
        await db
            .insert(blocTable)
            .values({
                id: bloc.id,
                name: bloc.name,
                programId: bloc.programId,
            })
            .onConflictDoUpdate({
                target: blocTable.id,
                set: {
                    name: bloc.name,
                    programId: bloc.programId,
                },
            });
    },
    async deleteById(id) {
        await db.delete(blocTable).where(eq(blocTable.id, id));
    },
    async list() {
        const result = await db.select().from(blocTable).orderBy(asc(blocTable.name));
        return result.map(rowToBloc);
    },
};
