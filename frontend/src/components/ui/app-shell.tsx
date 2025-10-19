"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { AuthButtons } from "@/components/auth/auth-buttons";
import { hasRequiredRole } from "@/lib/roles";
import { extractRolesFromToken } from "@/lib/token-roles";

export function AppShell({ children }: PropsWithChildren) {
  const { data: session } = useSession();
  const roles = useMemo(() => {
    const fromSession = session?.user?.roles ?? [];
    if (fromSession.length > 0) return fromSession;
    if (session?.access_token) {
      return extractRolesFromToken(session.access_token);
    }
    return [];
  }, [session?.user?.roles, session?.access_token]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-semibold text-slate-900">
            SkyNet Field Ops
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-700">
            {hasRequiredRole(roles, ["tecnico"]) && (
              <Link href="/tecnico" className="transition hover:text-accent">
                Técnico
              </Link>
            )}
            {hasRequiredRole(roles, ["supervisor"]) && (
              <Link href="/supervisor" className="transition hover:text-accent">
                Supervisor
              </Link>
            )}
            {hasRequiredRole(roles, ["admin"]) && (
              <Link href="/clientes" className="transition hover:text-accent">
                Clientes
              </Link>
            )}
          </nav>
          <AuthButtons />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} SkyNet. Requerimientos académicos.
        </div>
      </footer>
    </div>
  );
}
