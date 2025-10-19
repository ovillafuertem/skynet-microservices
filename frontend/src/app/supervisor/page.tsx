import { RoleGuard } from "@/components/auth/role-guard";
import { backendFetch } from "@/lib/api-client";
import { auth } from "@/lib/auth";
import type { VisitSummary } from "@/lib/types";
import SupervisorDashboard from "./_components/supervisor-dashboard";

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export default async function SupervisorPage() {
  const session = await auth();
  const today = formatDate(new Date());
  let visits: VisitSummary[] = [];
  let initialError: string | null = null;

  if (session?.access_token) {
    try {
      visits = await backendFetch<VisitSummary[]>("visits", `visits?date=${today}`);
    } catch (error) {
      console.error("Error fetching supervisor visits", error);
      initialError =
        error instanceof Error ? error.message : "No fue posible cargar las visitas.";
    }
  }

  return (
    <RoleGuard requiredRoles={["supervisor", "admin"]}>
      <SupervisorDashboard initialVisits={visits} initialError={initialError} defaultDate={today} />
    </RoleGuard>
  );
}
