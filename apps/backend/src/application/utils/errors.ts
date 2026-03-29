export type ErrorLike = unknown;

export function ensureError(
  value: unknown,
  fallbackMessage = "Unexpected error"
): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return new Error(value.toString());
  }
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return new Error(value.message);
  }
  return new Error(fallbackMessage);
}
