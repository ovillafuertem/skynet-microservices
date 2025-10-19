"use client";

import { useSession } from "next-auth/react";
import { signIn, signOut } from "next-auth/react";

export function AuthButtons() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded bg-slate-900 px-3 py-1 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Salir
        </button>
      ) : (
        <button
          onClick={() => signIn("keycloak")}
          className="rounded bg-accent px-3 py-1 text-sm font-semibold text-white transition hover:bg-cyan-500"
        >
          Ingresar
        </button>
      )}
    </div>
  );
}
