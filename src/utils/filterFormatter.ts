export function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function getNumber(value: unknown): number | undefined {
  const num = Number(value);
  return !isNaN(num) ? num : undefined;
}

export function getNumberOrUndefined(value: unknown): number | undefined {
  const num = Number(value);
  return !isNaN(num) ? num : undefined;
}

export function isValidSortBy(value: unknown): boolean {
  return (
    value === "name" ||
    value === "createdAt" ||
    value === "updatedAt" ||
    value === "amount" ||
    value === "status" ||
    value === "provider" ||
    value === "order"
  );
}

export function isValidSortOrder(value: unknown): boolean {
  return value === "asc" || value === "desc";
}
