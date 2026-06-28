import { randomUUID } from "node:crypto";
import { type Module } from "@domain/module/module.entity";
import { type ModuleRepository } from "@application/module/module.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type ModuleView = {
    id: string;
    name: string;
    code: string | null;
    coefficient: number;
    ectsCredits: number;
};

export type CreateModuleResult = MissingFields | { kind: "module_created"; module: ModuleView };

export type UpdateModuleResult =
    | NotFound
    | { kind: "module_updated"; module: ModuleView };

export type DeleteModuleResult = NotFound | { kind: "module_deleted" };

export type GetModuleResult = NotFound | { kind: "module_found"; module: ModuleView };

export type ListModulesResult = { kind: "modules_listed"; modules: ModuleView[] };

const toView = (m: Module): ModuleView => ({
    id: m.id,
    name: m.name,
    code: m.code,
    coefficient: m.coefficient,
    ectsCredits: m.ectsCredits,
});

export class ModuleUseCases {
    constructor(private readonly modules: ModuleRepository) {}

    async create(input: {
        name?: string;
        code?: string;
        coefficient?: number;
        ectsCredits?: number;
    }): Promise<CreateModuleResult> {
        const { name, code, coefficient, ectsCredits } = input;
        if (!name || coefficient === undefined || ectsCredits === undefined) return MissingFields;
        const module: Module = { id: randomUUID(), name, code: code ?? null, coefficient, ectsCredits };
        await this.modules.save(module);
        return { kind: "module_created", module: toView(module) };
    }

    async update(
        id: string,
        input: { name?: string; code?: string; coefficient?: number; ectsCredits?: number },
    ): Promise<UpdateModuleResult> {
        const module = await this.modules.findById(id);
        if (!module) return NotFound;
        if (input.name !== undefined) module.name = input.name;
        if (input.code !== undefined) module.code = input.code ?? null;
        if (input.coefficient !== undefined) module.coefficient = input.coefficient;
        if (input.ectsCredits !== undefined) module.ectsCredits = input.ectsCredits;
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
