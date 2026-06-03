import { asc, eq } from "drizzle-orm";
import { type CompanyRepository } from "@application/company/company.repository";
import { type Company } from "@domain/company/company.entity";
import { db } from "@express/src/postgres/db";
import { company as companyTable } from "@express/src/postgres/schema/company";

function rowToCompany(row: typeof companyTable.$inferSelect): Company {
    return {
        id: row.id,
        name: row.name,
        siret: row.siret,
        address: row.address,
        contactName: row.contactName,
        contactNumber: row.contactNumber,
        contactEmail: row.contactEmail,
    };
}

export const companyRepository: CompanyRepository = {
    async findById(id) {
        const result = await db.select().from(companyTable).where(eq(companyTable.id, id)).limit(1);
        return result[0] ? rowToCompany(result[0]) : undefined;
    },
    async findBySiret(siret) {
        const result = await db.select().from(companyTable).where(eq(companyTable.siret, siret)).limit(1);
        return result[0] ? rowToCompany(result[0]) : undefined;
    },
    async save(company) {
        await db
            .insert(companyTable)
            .values({
                id: company.id,
                name: company.name,
                siret: company.siret,
                address: company.address,
                contactName: company.contactName,
                contactNumber: company.contactNumber,
                contactEmail: company.contactEmail,
            })
            .onConflictDoUpdate({
                target: companyTable.id,
                set: {
                    name: company.name,
                    siret: company.siret,
                    address: company.address,
                    contactName: company.contactName,
                    contactNumber: company.contactNumber,
                    contactEmail: company.contactEmail,
                },
            });
    },
    async deleteById(id) {
        await db.delete(companyTable).where(eq(companyTable.id, id));
    },
    async list() {
        const result = await db.select().from(companyTable).orderBy(asc(companyTable.name));
        return result.map(rowToCompany);
    },
};
