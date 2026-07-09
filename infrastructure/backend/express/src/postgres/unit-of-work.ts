import { type UnitOfWork } from "@application/types/unit-of-work";
import { rootDb, txStore } from "@express/src/postgres/db";

export const unitOfWork: UnitOfWork = {
    async run(work) {
        const active = txStore.getStore();
        if (active) return work();
        return rootDb.transaction((tx) => txStore.run(tx, work));
    },
};
