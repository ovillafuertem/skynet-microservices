"use client";

import { hasRequiredRole, type UserRole } from "@/lib/roles";
import { extractRolesFromToken } from "@/lib/token-roles";
import { signIn, useSession } from "next-auth/react";
import type { PropsWithChildren } from "react";

interface RoleGuardProps extends PropsWithChildren {
  requiredRoles?: UserRole[];
}

export function RoleGuard({ children, requiredRoles = [] }: RoleGuardProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="rounded border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        Cargando sesión...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-2 rounded border border-slate-200 bg-white p-6 text-center text-sm text-slate-700">
        <p>Necesitas iniciar sesión.</p>
        <button
          onClick={() => signIn("keycloak")}
          className="rounded bg-accent px-3 py-1 font-semibold text-white hover:bg-cyan-500"
        >
          Ingresar
        </button>
      </div>
    );
  }

  const roles = session.user.roles?.length ? session.user.roles : extractRolesFromToken(session.access_token);

  if (!hasRequiredRole(roles ?? [], requiredRoles)) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        No tienes permiso para acceder a esta sección.
      </div>
    );
  }

  return <>{children}</>;
}
