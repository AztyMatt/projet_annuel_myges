import { randomUUID } from "node:crypto";
import { type Admin } from "@domain/admin/admin.entity";
import { type AdminRole } from "@domain/admin/admin.enums";
import { type AdminRepository } from "@application/admin/admin.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type AdminView = {
    id: string;
    userId: string;
    instructorId: string | null;
    role: AdminRole;
};

export type CreateAdminResult =
    | MissingFields
    | { kind: "user_already_admin" }
    | { kind: "admin_created"; admin: AdminView };

export type UpdateAdminResult =
    | NotFound
    | { kind: "admin_updated"; admin: AdminView };

export type DeleteAdminResult = NotFound | { kind: "admin_deleted" };

export type GetAdminResult = NotFound | { kind: "admin_found"; admin: AdminView };

export type ListAdminsResult = { kind: "admins_listed"; admins: AdminView[] };

const toView = (a: Admin): AdminView => ({
    id: a.id,
    userId: a.userId,
    instructorId: a.instructorId,
    role: a.role,
});

export class AdminUseCases {
    constructor(private readonly admins: AdminRepository) {}

    async create(input: { userId?: string; role?: AdminRole; instructorId?: string }): Promise<CreateAdminResult> {
        const { userId, role, instructorId } = input;
        if (!userId || !role) return MissingFields;
        if (await this.admins.findByUserId(userId)) return { kind: "user_already_admin" };
        const admin: Admin = { id: randomUUID(), userId, role, instructorId: instructorId ?? null };
        await this.admins.save(admin);
        return { kind: "admin_created", admin: toView(admin) };
    }

    async update(
        id: string,
        input: { role?: AdminRole; instructorId?: string },
    ): Promise<UpdateAdminResult> {
        const admin = await this.admins.findById(id);
        if (!admin) return NotFound;
        if (input.role !== undefined) admin.role = input.role;
        if (input.instructorId !== undefined) admin.instructorId = input.instructorId ?? null;
        await this.admins.save(admin);
        return { kind: "admin_updated", admin: toView(admin) };
    }

    async delete(id: string): Promise<DeleteAdminResult> {
        const admin = await this.admins.findById(id);
        if (!admin) return NotFound;
        await this.admins.deleteById(id);
        return { kind: "admin_deleted" };
    }

    async list(): Promise<ListAdminsResult> {
        const admins = await this.admins.list();
        return { kind: "admins_listed", admins: admins.map(toView) };
    }

    async findById(id: string): Promise<GetAdminResult> {
        const admin = await this.admins.findById(id);
        if (!admin) return NotFound;
        return { kind: "admin_found", admin: toView(admin) };
    }

    async findByUserId(userId: string): Promise<GetAdminResult> {
        const admin = await this.admins.findByUserId(userId);
        if (!admin) return NotFound;
        return { kind: "admin_found", admin: toView(admin) };
    }
}
