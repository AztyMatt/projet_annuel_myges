import { z } from "zod";

export const zDateString = z.union([z.iso.datetime(), z.iso.date()]);

export const patchBody = <Shape extends z.ZodRawShape>(shape: Shape) =>
    z.object(shape).refine((value) => Object.keys(value).length > 0, {
        message: "au moins un champ doit être fourni",
    });
