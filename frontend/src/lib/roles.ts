export type UserRole = "admin" | "supervisor" | "tecnico" | string;

export function hasRequiredRole(userRoles: UserRole[] = [], required: UserRole[] = []): boolean {
  if (required.length === 0) return true;
  const normalizedUserRoles = userRoles.map((role) => role.toLowerCase());
  if (normalizedUserRoles.includes("admin")) return true;
  return required.some((role) => normalizedUserRoles.includes(role.toLowerCase()));
}
