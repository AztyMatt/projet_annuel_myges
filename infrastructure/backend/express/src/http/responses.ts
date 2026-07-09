import { type Response } from "express";

export type HttpStatus = 200 | 201 | 400 | 401 | 403 | 404 | 405 | 409 | 423 | 500;

type ExactlyOne<Fields> = {
    [Key in keyof Fields]: Pick<Fields, Key> & Partial<Record<Exclude<keyof Fields, Key>, never>>;
}[keyof Fields];

export type SendOptions = { status?: HttpStatus } & ExactlyOne<{
    body: unknown;
    error: string;
    blocked: { type: "Deletion" | "Operation" | "Creation"; reason: string };
}>;

export const FORBIDDEN_MESSAGE = "Forbidden: insufficient role";
export const UNAUTHORIZED_MESSAGE = "Unauthorized";

export const send = (res: Response, opts: SendOptions): void => {
    const status = opts.status ?? 200;
    if (opts.blocked) return void res.status(409).json({ error: opts.blocked.reason, type: opts.blocked.type });
    if (opts.error !== undefined) return void res.status(status).json({ error: opts.error });
    res.status(status).json(opts.body);
};

type SendOptionsFor<Variant> = SendOptions | ((result: Variant) => SendOptions);

type ResultHandlers<Result extends { kind: string }> = {
    [Kind in Exclude<Result["kind"], "forbidden">]: SendOptionsFor<Extract<Result, { kind: Kind }>>;
};

export const respond = <Result extends { kind: string }>(
    res: Response,
    result: Result,
    handlers: ResultHandlers<Result>,
): void => {
    if (result.kind === "forbidden") return void send(res, { status: 403, error: FORBIDDEN_MESSAGE });
    const handler = (handlers as Record<string, SendOptionsFor<Result> | undefined>)[result.kind];
    if (handler === undefined) return void send(res, { status: 500, error: "Unexpected result" });
    send(res, typeof handler === "function" ? handler(result) : handler);
};
