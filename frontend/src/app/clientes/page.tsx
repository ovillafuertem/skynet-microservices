import { RoleGuard } from "@/components/auth/role-guard";
import { backendFetch } from "@/lib/api-client";
import { auth } from "@/lib/auth";
import type { ClientSummary, ClientsResponse } from "@/lib/types";
import ClientesDashboard from "./_components/clientes-dashboard";

export default async function ClientesPage() {
  const session = await auth();
  let clients: ClientSummary[] = [];
  let initialError: string | null = null;

  if (session?.access_token) {
    try {
      const response = await backendFetch<ClientsResponse | ClientSummary[]>("clients", "clients");
      clients = Array.isArray(response) ? response : response.items ?? [];
    } catch (error) {
      console.error("Error fetching clients", error);
      initialError = error instanceof Error ? error.message : "No se pudieron cargar los clientes.";
    }
  }

  return (
    <RoleGuard requiredRoles={["supervisor", "admin"]}>
      <ClientesDashboard initialClients={clients} initialError={initialError} />
    </RoleGuard>
  );
}
