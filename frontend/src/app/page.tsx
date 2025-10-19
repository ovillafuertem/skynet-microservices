import Link from "next/link";
import { auth } from "@/lib/auth";
import { hasRequiredRole } from "@/lib/roles";
import { extractRolesFromToken } from "@/lib/token-roles";

export default async function HomePage() {
  const session = await auth();
  const rolesFromSession = session?.user?.roles ?? [];
  const roles = rolesFromSession.length > 0 ? rolesFromSession : extractRolesFromToken(session?.access_token);

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Bienvenido a SkyNet Field Ops</h1>
        <p className="mt-2 text-sm text-slate-600">
          Gestiona visitas técnicas, confirma asistencia en campo y automatiza el reporte final
          con notificaciones por correo.
        </p>
        {!session && (
          <p className="mt-4 text-sm text-slate-700">
            Inicia sesión para acceder a tu tablero. Usa el botón “Ingresar” en la parte superior.
          </p>
        )}
        {session && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {hasRequiredRole(roles, ["tecnico"]) && (
              <Link
                href="/tecnico"
                className="rounded border border-slate-200 p-4 transition hover:border-accent hover:text-accent"
              >
                Panel de Técnico
              </Link>
            )}
            {hasRequiredRole(roles, ["supervisor"]) && (
              <Link
                href="/supervisor"
                className="rounded border border-slate-200 p-4 transition hover:border-accent hover:text-accent"
              >
                Panel de Supervisor
              </Link>
            )}
            {hasRequiredRole(roles, ["admin"]) && (
              <Link
                href="/clientes"
                className="rounded border border-slate-200 p-4 transition hover:border-accent hover:text-accent"
              >
                Gestión de Clientes
              </Link>
            )}
          </div>
        )}
      </section>
      <section className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-600">
        <h2 className="text-lg font-semibold text-slate-900">Contexto rápido</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Autenticación federada con Keycloak (realm skynet) y control de roles.</li>
          <li>Tableros diferenciados para técnicos y supervisores.</li>
          <li>Integración con visitas, clientes y notificaciones vía API REST.</li>
          <li>Soporte para mapas y direcciones con Google Maps.</li>
        </ul>
      </section>
    </div>
  );
}
