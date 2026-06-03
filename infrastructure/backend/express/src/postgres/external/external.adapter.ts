import { eq } from "drizzle-orm";
import { type ExternalRepository } from "@application/external/external.repository";
import { type External } from "@domain/external/external.entity";
import { ExternalType } from "@domain/external/external.enums";
import { assertEnum } from "@express/src/postgres/assert-enum";
import { db } from "@express/src/postgres/db";
import { external as externalTable } from "@express/src/postgres/schema/external";

function rowToExternal(row: typeof externalTable.$inferSelect): External {
    return {
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        type: assertEnum(row.type, ExternalType),
    };
}

export const externalRepository: ExternalRepository = {
    async findById(id) {
        const result = await db.select().from(externalTable).where(eq(externalTable.id, id)).limit(1);
        return result[0] ? rowToExternal(result[0]) : undefined;
    },
    async findByEmail(email) {
        const result = await db.select().from(externalTable).where(eq(externalTable.email, email)).limit(1);
        return result[0] ? rowToExternal(result[0]) : undefined;
    },
    async save(external) {
        await db
            .insert(externalTable)
            .values({
                id: external.id,
                firstName: external.firstName,
                lastName: external.lastName,
                email: external.email,
                type: external.type,
            })
            .onConflictDoUpdate({
                target: externalTable.id,
                set: {
                    firstName: external.firstName,
                    lastName: external.lastName,
                    email: external.email,
                    type: external.type,
                },
            });
    },
    async deleteById(id) {
        await db.delete(externalTable).where(eq(externalTable.id, id));
    },
    async list() {
        const result = await db.select().from(externalTable);
        return result.map(rowToExternal);
    },
};
