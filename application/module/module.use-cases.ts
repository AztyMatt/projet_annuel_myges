import { randomUUID } from "node:crypto";
import { type Module } from "@domain/module/module.entity";
import { type ModuleRepository } from "@application/module/module.repository";
import { type ProgramModuleRepository } from "@application/program/program-module/program-module.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type ManualNotationRepository } from "@application/grade/grade-manual-notation/manual-notation/manual-notation.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, MissingFields, Forbidden } from "@application/types/results";

export type ModuleView = {
    id: string;
    name: string;
    code: string;
};

export type CreateModuleResult =
    | MissingFields
    | Forbidden
    | { kind: "module_already_exists" }
    | { kind: "module_created"; module: ModuleView };

export type UpdateModuleResult =
    | NotFound
    | Forbidden
    | { kind: "module_already_exists" }
    | { kind: "module_updated"; module: ModuleView };

export type DeleteModuleResult =
    | NotFound
    | Forbidden
    | { kind: "module_has_programs" }
    | { kind: "module_has_courses" }
    | { kind: "module_has_notations" }
    | { kind: "module_deleted" };

export type GetModuleResult = NotFound | { kind: "module_found"; module: ModuleView };

export type ListModulesResult = { kind: "modules_listed"; modules: ModuleView[] };

const toView = (m: Module): ModuleView => ({
    id: m.id,
    name: m.name,
    code: m.code,
});

export class ModuleUseCases {
    constructor(
        private readonly modules: ModuleRepository,
        private readonly programModules: ProgramModuleRepository,
        private readonly courses: CourseRepository,
        private readonly manualNotations: ManualNotationRepository,
    ) {}

    async create(input: { name?: string; code?: string }, auth: AuthContext): Promise<CreateModuleResult> {
        if (!auth.isAdmin) return Forbidden;
        const { name, code } = input;
        if (!name) return MissingFields;
        const resolvedCode = code ?? "";
        if (await this.modules.findByNameAndCode(name, resolvedCode)) return { kind: "module_already_exists" };
        const module: Module = { id: randomUUID(), name, code: resolvedCode };
        await this.modules.save(module);
        return { kind: "module_created", module: toView(module) };
    }

    async update(id: string, input: { name?: string; code?: string }, auth: AuthContext): Promise<UpdateModuleResult> {
        if (!auth.isAdmin) return Forbidden;
        const module = await this.modules.findById(id);
        if (!module) return NotFound;
        const newName = input.name !== undefined ? input.name : module.name;
        const newCode = input.code !== undefined ? input.code : module.code;
        const existing = await this.modules.findByNameAndCode(newName, newCode);
        if (existing && existing.id !== id) return { kind: "module_already_exists" };
        module.name = newName;
        module.code = newCode;
        await this.modules.save(module);
        return { kind: "module_updated", module: toView(module) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteModuleResult> {
        if (!auth.isAdmin) return Forbidden;
        const module = await this.modules.findById(id);
        if (!module) return NotFound;
        if (await this.programModules.existsByModuleId(id)) return { kind: "module_has_programs" };
        if (await this.courses.existsByModuleId(id)) return { kind: "module_has_courses" };
        if (await this.manualNotations.existsByModuleId(id)) return { kind: "module_has_notations" };
        await this.modules.deleteById(id);
        return { kind: "module_deleted" };
    }

    async list(): Promise<ListModulesResult> {
        const modules = await this.modules.list();
        return { kind: "modules_listed", modules: modules.map(toView) };
    }

    async findById(id: string): Promise<GetModuleResult> {
        const module = await this.modules.findById(id);
        if (!module) return NotFound;
        return { kind: "module_found", module: toView(module) };
    }
}
