import { eq } from "drizzle-orm";
import { type AdminRepository } from "@application/admin/admin.repository";
import { type Admin } from "@domain/admin/admin.entity";
import { AdminRole } from "@domain/admin/admin.enums";
import { assertEnum } from "@express/src/postgres/assert-enum";
import { db } from "@express/src/postgres/db";
import { admin as adminTable } from "@express/src/postgres/schema/admin";

function rowToAdmin(row: typeof adminTable.$inferSelect): Admin {
    return {
        id: row.id,
        userId: row.userId,
        role: assertEnum(row.role, AdminRole),
    };
}

export const adminRepository: AdminRepository = {
    async findById(id) {
        const result = await db.select().from(adminTable).where(eq(adminTable.id, id)).limit(1);
        return result[0] ? rowToAdmin(result[0]) : undefined;
    },
    async findByUserId(userId) {
        const result = await db.select().from(adminTable).where(eq(adminTable.userId, userId)).limit(1);
        return result[0] ? rowToAdmin(result[0]) : undefined;
    },
    async save(admin) {
        await db
            .insert(adminTable)
            .values({
                id: admin.id,
                userId: admin.userId,
                role: admin.role,
            })
            .onConflictDoUpdate({
                target: adminTable.id,
                set: {
                    userId: admin.userId,
                    role: admin.role,
                },
            });
    },
    async deleteById(id) {
        await db.delete(adminTable).where(eq(adminTable.id, id));
    },
    async list() {
        const result = await db.select().from(adminTable);
        return result.map(rowToAdmin);
    },
};
