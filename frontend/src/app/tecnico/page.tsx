import { RoleGuard } from "@/components/auth/role-guard";
import { backendFetch } from "@/lib/api-client";
import { auth } from "@/lib/auth";
import type { VisitSummary } from "@/lib/types";
import TecnicoDashboard from "./_components/tecnico-dashboard";

export default async function TecnicoPage() {
  const session = await auth();
  let visits: VisitSummary[] = [];
  let initialError: string | null = null;

  if (session?.access_token) {
    try {
      visits = await backendFetch<VisitSummary[]>("visits", "visits/today");
    } catch (error) {
      console.error("Error fetching visits today", error);
      initialError =
        error instanceof Error ? error.message : "No fue posible cargar las visitas.";
    }
  }

  return (
    <RoleGuard requiredRoles={["tecnico", "admin"]}>
      <TecnicoDashboard initialVisits={visits} initialError={initialError} />
    </RoleGuard>
  );
}
