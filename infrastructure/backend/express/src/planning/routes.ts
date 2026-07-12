import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { planningUseCases } from "@express/src/container";
import { send, respond } from "@express/src/http/responses";

export const planningRouter = Router();

const parseDay = (value: unknown): Date | null | undefined => {
    if (value === undefined) return undefined;
    const raw = String(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const [year, month, day] = raw.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
};

planningRouter.get("/planning/mine", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const from = parseDay(req.query.from);
    const to = parseDay(req.query.to);
    if (from === null || to === null)
        return void send(res, { status: 400, error: "from et to doivent être des dates valides (AAAA-MM-JJ)" });
    if ((from && !to) || (!from && to))
        return void send(res, { status: 400, error: "from et to doivent être fournis ensemble" });
    const result = await planningUseCases.listMine(auth, { from: from ?? undefined, to: to ?? undefined });
    respond(res, result, {
        not_found: { status: 404, error: "Aucun profil étudiant ou intervenant pour ce compte" },
        planning_listed: (r) => ({ status: 200, body: r.mode === "range"
            ? { mode: r.mode, from: r.from, to: r.to, entries: r.entries }
            : { mode: r.mode, weeks: r.weeks } }),
    });
}));
