import { jwtDecode } from "jwt-decode";

type DecodedToken = {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
};

export function extractRolesFromToken(token?: string | null): string[] {
  if (!token) return [];
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const realmRoles = decoded.realm_access?.roles ?? [];
    const resourceRoles = Object.values(decoded.resource_access ?? {}).flatMap(
      (resource) => resource.roles ?? []
    );
    return Array.from(new Set([...realmRoles, ...resourceRoles])).map((role) => role.toLowerCase());
  } catch (error) {
    console.warn("Unable to decode token roles", error);
    return [];
  }
}
