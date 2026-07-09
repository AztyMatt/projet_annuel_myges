import { randomUUID } from "node:crypto";
import { type Company } from "@domain/company/company.entity";
import { type CompanyRepository } from "@application/company/company.repository";
import { type DocumentApprenticeshipContractRepository } from "@application/document/document-apprenticeship-contract/document-apprenticeship-contract.repository";
import { NotFound, MissingFields, Forbidden } from "@application/types/results";
import { type AuthContext } from "@application/types/auth-context";

export type CompanyView = {
    id: string;
    name: string;
    siret: string;
    address: string;
    contactName: string;
    contactNumber: string | null;
    contactEmail: string | null;
};

export type CreateCompanyResult =
    | MissingFields
    | Forbidden
    | { kind: "siret_already_exists" }
    | { kind: "company_created"; company: CompanyView };

export type UpdateCompanyResult =
    | NotFound
    | Forbidden
    | { kind: "company_updated"; company: CompanyView };

export type DeleteCompanyResult = NotFound | Forbidden | { kind: "company_has_contracts" } | { kind: "company_deleted" };

export type GetCompanyResult = NotFound | { kind: "company_found"; company: CompanyView };

export type ListCompaniesResult = { kind: "companies_listed"; companies: CompanyView[] };

const toView = (c: Company): CompanyView => ({
    id: c.id,
    name: c.name,
    siret: c.siret,
    address: c.address,
    contactName: c.contactName,
    contactNumber: c.contactNumber,
    contactEmail: c.contactEmail,
});

export class CompanyUseCases {
    constructor(
        private readonly companies: CompanyRepository,
        private readonly documentApprenticeshipContracts: DocumentApprenticeshipContractRepository,
    ) {}

    async create(input: {
        name?: string;
        siret?: string;
        address?: string;
        contactName?: string;
        contactNumber?: string;
        contactEmail?: string;
    }, auth: AuthContext): Promise<CreateCompanyResult> {
        if (!auth.isAdmin) return Forbidden;
        const { name, siret, address, contactName, contactNumber, contactEmail } = input;
        if (!name || !siret || !address || !contactName) return MissingFields;
        if (await this.companies.findBySiret(siret)) return { kind: "siret_already_exists" };
        const company: Company = {
            id: randomUUID(),
            name,
            siret,
            address,
            contactName,
            contactNumber: contactNumber ?? null,
            contactEmail: contactEmail ?? null,
        };
        await this.companies.save(company);
        return { kind: "company_created", company: toView(company) };
    }

    async update(
        id: string,
        input: {
            name?: string;
            siret?: string;
            address?: string;
            contactName?: string;
            contactNumber?: string;
            contactEmail?: string;
        },
        auth: AuthContext,
    ): Promise<UpdateCompanyResult> {
        if (!auth.isAdmin) return Forbidden;
        const company = await this.companies.findById(id);
        if (!company) return NotFound;
        if (input.name !== undefined) company.name = input.name;
        if (input.siret !== undefined) company.siret = input.siret;
        if (input.address !== undefined) company.address = input.address;
        if (input.contactName !== undefined) company.contactName = input.contactName;
        if (input.contactNumber !== undefined) company.contactNumber = input.contactNumber ?? null;
        if (input.contactEmail !== undefined) company.contactEmail = input.contactEmail ?? null;
        await this.companies.save(company);
        return { kind: "company_updated", company: toView(company) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteCompanyResult> {
        if (!auth.isAdmin) return Forbidden;
        const company = await this.companies.findById(id);
        if (!company) return NotFound;
        if (await this.documentApprenticeshipContracts.existsByCompanyId(id)) return { kind: "company_has_contracts" };
        await this.companies.deleteById(id);
        return { kind: "company_deleted" };
    }

    async list(): Promise<ListCompaniesResult> {
        const companies = await this.companies.list();
        return { kind: "companies_listed", companies: companies.map(toView) };
    }

    async findById(id: string): Promise<GetCompanyResult> {
        const company = await this.companies.findById(id);
        if (!company) return NotFound;
        return { kind: "company_found", company: toView(company) };
    }
}
