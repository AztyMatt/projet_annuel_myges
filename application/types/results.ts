export type NotFound = { kind: "not_found" };
export const NotFound: NotFound = { kind: "not_found" };

export type MissingFields = { kind: "missing_fields" };
export const MissingFields: MissingFields = { kind: "missing_fields" };

export type Forbidden = { kind: "forbidden"; reason?: "role" | "ownership" };
export const Forbidden: Forbidden = { kind: "forbidden" };
export const ForbiddenOwnership: Forbidden = { kind: "forbidden", reason: "ownership" };
