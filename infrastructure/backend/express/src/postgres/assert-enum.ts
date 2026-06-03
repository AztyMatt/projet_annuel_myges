export function assertEnum<T extends string>(value: string, enumObject: Record<string, T>): T {
  const validValues = Object.values(enumObject)
  if (!validValues.includes(value as T)) {
    throw new Error(`Invalid enum value "${value}". Expected one of: ${validValues.join(", ")}`)
  }
  return value as T
}
