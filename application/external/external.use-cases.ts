import { randomUUID } from "node:crypto";
import { type External } from "@domain/external/external.entity";
import { type ExternalType } from "@domain/external/external.enums";
import { type ExternalRepository } from "@application/external/external.repository";
import { type SessionExamExternalRepository } from "@application/session/session-exam/session-exam-external/session-exam-external.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, MissingFields, Forbidden } from "@application/types/results";

export type ExternalView = {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    type: ExternalType;
};

export type CreateExternalResult =
    | MissingFields
    | Forbidden
    | { kind: "external_already_exists" }
    | { kind: "external_created"; external: ExternalView };

export type UpdateExternalResult =
    | NotFound
    | Forbidden
    | { kind: "external_updated"; external: ExternalView };

export type DeleteExternalResult = NotFound | Forbidden | { kind: "external_has_session_exams" } | { kind: "external_deleted" };

export type GetExternalResult = NotFound | Forbidden | { kind: "external_found"; external: ExternalView };

export type ListExternalsResult = Forbidden | { kind: "externals_listed"; externals: ExternalView[] };

const toView = (e: External): ExternalView => ({
    id: e.id,
    firstname: e.firstname,
    lastname: e.lastname,
    email: e.email,
    type: e.type,
});

export class ExternalUseCases {
    constructor(
        private readonly externals: ExternalRepository,
        private readonly sessionExamExternals: SessionExamExternalRepository,
    ) {}

    async create(input: {
        firstname?: string;
        lastname?: string;
        email?: string;
        type?: ExternalType;
    }, auth: AuthContext): Promise<CreateExternalResult> {
        if (!auth.isAdmin) return Forbidden;
        const { firstname, lastname, email, type } = input;
        if (!firstname || !lastname || !email || !type) return MissingFields;
        if (await this.externals.findByIdentity(firstname, lastname, email)) return { kind: "external_already_exists" };
        const external: External = { id: randomUUID(), firstname, lastname, email, type };
        await this.externals.save(external);
        return { kind: "external_created", external: toView(external) };
    }

    async update(
        id: string,
        input: { firstname?: string; lastname?: string; email?: string; type?: ExternalType },
        auth: AuthContext,
    ): Promise<UpdateExternalResult> {
        if (!auth.isAdmin) return Forbidden;
        const external = await this.externals.findById(id);
        if (!external) return NotFound;
        if (input.firstname !== undefined) external.firstname = input.firstname;
        if (input.lastname !== undefined) external.lastname = input.lastname;
        if (input.email !== undefined) external.email = input.email;
        if (input.type !== undefined) external.type = input.type;
        await this.externals.save(external);
        return { kind: "external_updated", external: toView(external) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteExternalResult> {
        if (!auth.isAdmin) return Forbidden;
        const external = await this.externals.findById(id);
        if (!external) return NotFound;
        if (await this.sessionExamExternals.existsByExternalId(id)) return { kind: "external_has_session_exams" };
        await this.externals.deleteById(id);
        return { kind: "external_deleted" };
    }

    async list(auth: AuthContext): Promise<ListExternalsResult> {
        if (!auth.isAdmin) return Forbidden;
        const externals = await this.externals.list();
        return { kind: "externals_listed", externals: externals.map(toView) };
    }

    async findById(id: string, auth: AuthContext): Promise<GetExternalResult> {
        if (!auth.isAdmin) return Forbidden;
        const external = await this.externals.findById(id);
        if (!external) return NotFound;
        return { kind: "external_found", external: toView(external) };
    }
}
