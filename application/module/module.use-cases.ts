import { randomUUID } from "node:crypto";
import { type Module } from "@domain/module/module.entity";
import { type ModuleRepository } from "@application/module/module.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type ModuleView = {
    id: string;
    name: string;
    code: string | null;
};

export type CreateModuleResult =
    | MissingFields
    | { kind: "module_already_exists" }
    | { kind: "module_created"; module: ModuleView };

export type UpdateModuleResult =
    | NotFound
    | { kind: "module_already_exists" }
    | { kind: "module_updated"; module: ModuleView };

export type DeleteModuleResult = NotFound | { kind: "module_deleted" };

export type GetModuleResult = NotFound | { kind: "module_found"; module: ModuleView };

export type ListModulesResult = { kind: "modules_listed"; modules: ModuleView[] };

const toView = (m: Module): ModuleView => ({
    id: m.id,
    name: m.name,
    code: m.code,
});

export class ModuleUseCases {
    constructor(private readonly modules: ModuleRepository) {}

    async create(input: { name?: string; code?: string }): Promise<CreateModuleResult> {
        const { name, code } = input;
        if (!name) return MissingFields;
        const resolvedCode = code ?? null;
        if (await this.modules.findByNameAndCode(name, resolvedCode)) return { kind: "module_already_exists" };
        const module: Module = { id: randomUUID(), name, code: resolvedCode };
        await this.modules.save(module);
        return { kind: "module_created", module: toView(module) };
    }

    async update(id: string, input: { name?: string; code?: string }): Promise<UpdateModuleResult> {
        const module = await this.modules.findById(id);
        if (!module) return NotFound;
        const newName = input.name !== undefined ? input.name : module.name;
        const newCode = input.code !== undefined ? (input.code ?? null) : module.code;
        const existing = await this.modules.findByNameAndCode(newName, newCode);
        if (existing && existing.id !== id) return { kind: "module_already_exists" };
        module.name = newName;
        module.code = newCode;
        await this.modules.save(module);
        return { kind: "module_updated", module: toView(module) };
    }

    async delete(id: string): Promise<DeleteModuleResult> {
        const module = await this.modules.findById(id);
        if (!module) return NotFound;
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
