import { randomUUID } from "node:crypto";
import { type External } from "@domain/external/external.entity";
import { type ExternalType } from "@domain/external/external.enums";
import { type ExternalRepository } from "@application/external/external.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type ExternalView = {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    type: ExternalType;
};

export type CreateExternalResult =
    | MissingFields
    | { kind: "external_created"; external: ExternalView };

export type UpdateExternalResult =
    | NotFound
    | { kind: "external_updated"; external: ExternalView };

export type DeleteExternalResult = NotFound | { kind: "external_deleted" };

export type GetExternalResult = NotFound | { kind: "external_found"; external: ExternalView };

export type ListExternalsResult = { kind: "externals_listed"; externals: ExternalView[] };

const toView = (e: External): ExternalView => ({
    id: e.id,
    firstname: e.firstname,
    lastname: e.lastname,
    email: e.email,
    type: e.type,
});

export class ExternalUseCases {
    constructor(private readonly externals: ExternalRepository) {}

    async create(input: {
        firstname?: string;
        lastname?: string;
        email?: string;
        type?: ExternalType;
    }): Promise<CreateExternalResult> {
        const { firstname, lastname, email, type } = input;
        if (!firstname || !lastname || !email || !type) return MissingFields;
        const external: External = { id: randomUUID(), firstname, lastname, email, type };
        await this.externals.save(external);
        return { kind: "external_created", external: toView(external) };
    }

    async update(
        id: string,
        input: { firstname?: string; lastname?: string; email?: string; type?: ExternalType },
    ): Promise<UpdateExternalResult> {
        const external = await this.externals.findById(id);
        if (!external) return NotFound;
        if (input.firstname !== undefined) external.firstname = input.firstname;
        if (input.lastname !== undefined) external.lastname = input.lastname;
        if (input.email !== undefined) external.email = input.email;
        if (input.type !== undefined) external.type = input.type;
        await this.externals.save(external);
        return { kind: "external_updated", external: toView(external) };
    }

    async delete(id: string): Promise<DeleteExternalResult> {
        const external = await this.externals.findById(id);
        if (!external) return NotFound;
        await this.externals.deleteById(id);
        return { kind: "external_deleted" };
    }

    async list(): Promise<ListExternalsResult> {
        const externals = await this.externals.list();
        return { kind: "externals_listed", externals: externals.map(toView) };
    }

    async findById(id: string): Promise<GetExternalResult> {
        const external = await this.externals.findById(id);
        if (!external) return NotFound;
        return { kind: "external_found", external: toView(external) };
    }
}
