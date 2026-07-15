import { randomUUID } from "node:crypto";
import { type Admin } from "@domain/admin/admin.entity";
import { AdminRole } from "@domain/admin/admin.enums";
import { type AdminRepository } from "@application/admin/admin.repository";
import { type UserRepository } from "@application/auth/user.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, Forbidden } from "@application/types/results";
import { type AuditRecorder } from "@application/audit-log/audit-recorder";

export type AdminView = {
    id: string;
    userId: string;
    role: AdminRole;
};

export type CreateAdminResult =
    | Forbidden
    | { kind: "user_not_found" }
    | { kind: "user_already_admin" }
    | { kind: "admin_created"; admin: AdminView };

export type UpdateAdminResult =
    | NotFound
    | Forbidden
    | { kind: "admin_updated"; admin: AdminView };

export type DeleteAdminResult = NotFound | Forbidden | { kind: "admin_deleted" };

export type GetAdminResult = NotFound | Forbidden | { kind: "admin_found"; admin: AdminView };

export type ListAdminsResult = Forbidden | { kind: "admins_listed"; admins: AdminView[] };

const toView = (a: Admin): AdminView => ({
    id: a.id,
    userId: a.userId,
    role: a.role,
});

export class AdminUseCases {
    constructor(
        private readonly admins: AdminRepository,
        private readonly users: UserRepository,
        private readonly auditRecorder: AuditRecorder,
    ) {}

    async create(input: { userId?: string; role?: AdminRole }, auth: AuthContext): Promise<CreateAdminResult> {
        if (!auth.isSuperAdmin) return Forbidden;
        const { userId, role } = input as { userId: string; role: AdminRole };
        if (!(await this.users.findById(userId))) return { kind: "user_not_found" };
        if (await this.admins.findByUserId(userId)) return { kind: "user_already_admin" };
        const admin: Admin = { id: randomUUID(), userId, role };
        await this.admins.save(admin);
        await this.auditRecorder.record({
            userId: auth.requesterId,
            action: "CREATE",
            entityName: "admin",
            entityId: admin.id,
            newValue: { userId: admin.userId, role: admin.role },
        });
        return { kind: "admin_created", admin: toView(admin) };
    }

    async update(
        id: string,
        input: { role?: AdminRole },
        auth: AuthContext,
    ): Promise<UpdateAdminResult> {
        if (!auth.isSuperAdmin) return Forbidden;
        const admin = await this.admins.findById(id);
        if (!admin) return NotFound;
        const previousRole = admin.role;
        if (input.role !== undefined) admin.role = input.role;
        await this.admins.save(admin);
        await this.auditRecorder.record({
            userId: auth.requesterId,
            action: "UPDATE",
            entityName: "admin",
            entityId: admin.id,
            oldValue: { role: previousRole },
            newValue: { role: admin.role },
        });
        return { kind: "admin_updated", admin: toView(admin) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteAdminResult> {
        if (!auth.isSuperAdmin) return Forbidden;
        const admin = await this.admins.findById(id);
        if (!admin) return NotFound;
        await this.admins.deleteById(id);
        await this.auditRecorder.record({
            userId: auth.requesterId,
            action: "DELETE",
            entityName: "admin",
            entityId: admin.id,
            oldValue: { userId: admin.userId, role: admin.role },
            newValue: { deleted: true },
        });
        return { kind: "admin_deleted" };
    }

    async list(auth: AuthContext): Promise<ListAdminsResult> {
        if (!auth.isSuperAdmin) return Forbidden;
        const admins = await this.admins.list();
        return { kind: "admins_listed", admins: admins.map(toView) };
    }

    async findById(id: string, auth: AuthContext): Promise<GetAdminResult> {
        if (!auth.isSuperAdmin) return Forbidden;
        const admin = await this.admins.findById(id);
        if (!admin) return NotFound;
        return { kind: "admin_found", admin: toView(admin) };
    }

    async findByUserId(userId: string, auth: AuthContext): Promise<GetAdminResult> {
        if (!auth.isSuperAdmin) return Forbidden;
        const admin = await this.admins.findByUserId(userId);
        if (!admin) return NotFound;
        return { kind: "admin_found", admin: toView(admin) };
    }

    async resolveOwnAdmin(auth: AuthContext): Promise<NotFound | { kind: "admin_found"; admin: AdminView }> {
        const admin = await this.admins.findByUserId(auth.requesterId);
        if (!admin) return NotFound;
        return { kind: "admin_found", admin: toView(admin) };
    }
}
