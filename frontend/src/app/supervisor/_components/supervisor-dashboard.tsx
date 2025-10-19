"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import type { CreateVisitPayload, VisitSummary } from "@/lib/types";
import { extractRolesFromToken } from "@/lib/token-roles";
import { hasRequiredRole } from "@/lib/roles";

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const error = new Error("No fue posible cargar la información");
    throw Object.assign(error, { status: response.status });
  }
  return (await response.json()) as VisitSummary[];
};

interface SupervisorDashboardProps {
  initialVisits: VisitSummary[];
  initialError: string | null;
  defaultDate: string;
}

type KPIKey = "planificadas" | "enCurso" | "completadas" | "canceladas";

export default function SupervisorDashboard({
  initialVisits,
  initialError,
  defaultDate
}: SupervisorDashboardProps) {
  const { data: session } = useSession();
  const [dateFilter, setDateFilter] = useState(defaultDate);
  const [teamFilter, setTeamFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<CreateVisitPayload>({ scheduledAt: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [clientOptions, setClientOptions] = useState<Array<{ id: string; name: string; email?: string; status?: string }>>([]);
  const [technicianOptions, setTechnicianOptions] = useState<
    Array<{ id: string; name: string; keycloakUserId: string; email?: string }>
  >([]);
  const sessionRoles = useMemo(() => {
    if (!session) return [] as string[];
    return session.user.roles?.length ? session.user.roles : extractRolesFromToken(session.access_token);
  }, [session]);
  const canManageVisits = hasRequiredRole(sessionRoles, ["supervisor", "admin"]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [clientsResponse, techniciansResponse] = await Promise.all([
          fetch("/api/gateway/visits/clients"),
          fetch("/api/gateway/visits/technicians")
        ]);

        if (clientsResponse.ok) {
          const clientsPayload = (await clientsResponse.json()) as Array<{
            id: string;
            name: string;
            email?: string;
            status?: string;
          }>;
          setClientOptions(clientsPayload);
        }

        if (techniciansResponse.ok) {
          const techniciansPayload = (await techniciansResponse.json()) as Array<{
            id: string;
            name: string;
            keycloakUserId: string;
            email?: string;
          }>;
          setTechnicianOptions(techniciansPayload);
        }
      } catch (error) {
        console.warn("No fue posible cargar catálogos", error);
      }
    };

    loadOptions();
  }, []);

  const handleClientChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const selected = clientOptions.find((client) => client.id === value);
    setFormState((prev) => ({
      ...prev,
      clientId: value || undefined,
      clientName: selected?.name
    }));
  };

  const handleTechnicianChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const selected = technicianOptions.find((tech) => tech.keycloakUserId === value || tech.id === value);
    setFormState((prev) => ({
      ...prev,
      technicianId: selected?.keycloakUserId ?? (value || undefined),
      technicianName: selected?.name
    }));
  };

  const handleEditVisit = (visit: VisitSummary) => {
    if (visit.client && !clientOptions.some((client) => client.id === visit.client.id)) {
      setClientOptions((prev) => [
        ...prev,
        { id: visit.client.id, name: visit.client.name, email: visit.client.email ?? undefined, status: visit.client.status ?? undefined }
      ]);
    }
    if (visit.technician && visit.technician.keycloakUserId && !technicianOptions.some((tech) => tech.keycloakUserId === visit.technician?.keycloakUserId)) {
      const keycloakId = visit.technician.keycloakUserId;
      const identifier = visit.technician.id ?? keycloakId;
      setTechnicianOptions((prev) => [
        ...prev,
        {
          id: identifier,
          keycloakUserId: keycloakId,
          name: visit.technician?.name ?? "Técnico",
          email: visit.technician?.email ?? undefined
        }
      ]);
    }
    setFormState({
      clientId: visit.client.id,
      clientName: visit.client.name,
      technicianId: visit.technician?.keycloakUserId ?? undefined,
      technicianName: visit.technician?.name,
      scheduledAt: new Date(visit.scheduledAt).toISOString().slice(0, 16)
    });
    setEditingVisitId(visit.id);
    setShowForm(true);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCancelVisit = async (visit: VisitSummary) => {
    const reason = window.prompt("Motivo de cancelación (opcional)") ?? undefined;
    try {
      const response = await fetch(`/api/gateway/visits/${visit.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "CANCELED", cancelReason: reason || undefined })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "No se pudo cancelar la visita.");
      }
      await mutate();
      setFormSuccess("Visita cancelada.");
      setEditingVisitId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al cancelar la visita.");
    }
  };

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFilter) params.set("date", dateFilter);
    if (teamFilter) params.set("team", teamFilter);
    const suffix = params.toString();
    return suffix ? `/api/gateway/visits?${suffix}` : "/api/gateway/visits";
  }, [dateFilter, teamFilter]);

  const { data, error, isLoading, mutate } = useSWR<VisitSummary[]>(query, fetcher, {
    fallbackData: initialVisits,
    revalidateOnFocus: true
  });

  const visits = useMemo(() => data ?? [], [data]);
  const editingVisit = useMemo(
    () => (editingVisitId ? visits.find((visit) => visit.id === editingVisitId) ?? null : null),
    [visits, editingVisitId]
  );
  const isEditing = Boolean(editingVisitId);

  const kpis = useMemo(() => {
    const counters: Record<KPIKey, number> = {
      planificadas: 0,
      enCurso: 0,
      completadas: 0,
      canceladas: 0
    };

    for (const visit of visits) {
      const status = visit.status?.toUpperCase();
      if (status === "DONE" || status === "COMPLETED") {
        counters.completadas += 1;
      } else if (status === "CANCELED") {
        counters.canceladas += 1;
      } else if (visit.checkInAt && !visit.checkOutAt) {
        counters.enCurso += 1;
      } else {
        counters.planificadas += 1;
      }
    }

    return counters;
  }, [visits]);

  const toggleForm = () => {
    setShowForm((current) => {
      const next = !current;
      if (!next) {
        setEditingVisitId(null);
        setFormState({ scheduledAt: "" });
      }
      return next;
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmitVisit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    if ((!formState.clientId && !formState.clientName) || (!formState.technicianId && !formState.technicianName) || !formState.scheduledAt) {
      setFormError("Completa todos los campos obligatorios.");
      setFormLoading(false);
      return;
    }

    try {
      const selectedClientOption = clientOptions.find((client) => client.id === formState.clientId);
      if (
        selectedClientOption?.status?.toUpperCase() === "INACTIVE" &&
        (!isEditing || editingVisit?.client.id !== selectedClientOption.id)
      ) {
        setFormError("No puedes programar o reprogramar visitas para clientes inactivos.");
        setFormLoading(false);
        return;
      }

      const payload = {
        ...formState,
        scheduledAt: new Date(formState.scheduledAt).toISOString()
      };
      const endpoint = isEditing ? `/api/gateway/visits/${editingVisitId}` : "/api/gateway/visits";
      const method = isEditing ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        let message = isEditing ? "No se pudo actualizar la visita." : "No se pudo crear la visita.";
        try {
          const payload = await response.json();
          message = payload?.message ?? message;
        } catch {
          const text = await response.text();
          if (text) message = text;
        }
        throw new Error(message);
      }
      setFormSuccess(isEditing ? "Visita actualizada correctamente." : "Visita creada correctamente.");
      setFormState({ scheduledAt: "" });
      setEditingVisitId(null);
      setShowForm(false);
      await mutate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar la visita.");
    } finally {
      setFormLoading(false);
    }
  };

  const displayError = error ? "No fue posible cargar las visitas" : initialError;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Tablero del supervisor</h1>
          <p className="text-sm text-slate-600">
            Revisa el estado del equipo y programa nuevas visitas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex flex-col text-xs uppercase text-slate-500">
            Fecha
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="rounded border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs uppercase text-slate-500">
            Equipo (opcional)
            <input
              type="text"
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
              placeholder="ID o nombre"
              className="rounded border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          {canManageVisits && (
            <button
              onClick={toggleForm}
              className="ml-auto self-end rounded bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
              type="button"
            >
              {showForm ? "Cerrar" : "Nueva visita"}
            </button>
          )}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-xs uppercase text-slate-500">Planificadas</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{kpis.planificadas}</p>
        </article>
        <article className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-xs uppercase text-slate-500">En curso</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{kpis.enCurso}</p>
        </article>
        <article className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-xs uppercase text-slate-500">Completadas</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{kpis.completadas}</p>
        </article>
        <article className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-xs uppercase text-slate-500">Canceladas</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{kpis.canceladas}</p>
        </article>
      </section>

      {showForm && (
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{isEditing ? "Editar visita" : "Programar nueva visita"}</h2>
          <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmitVisit}>
            <label className="text-sm text-slate-600">
              Cliente
              <select
                value={formState.clientId ?? ""}
                onChange={handleClientChange}
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                required
              >
                <option value="">Selecciona un cliente</option>
                {clientOptions.map((client) => {
                  const inactive = client.status?.toUpperCase() === "INACTIVE";
                  const disableOption = inactive && (!isEditing || (editingVisit ? editingVisit.client.id !== client.id : true));
                  return (
                    <option key={client.id} value={client.id} disabled={disableOption}>
                      {client.name}
                      {client.email ? ` · ${client.email}` : ""}
                      {inactive ? " (Inactivo)" : ""}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Técnico
              <select
                value={formState.technicianId ?? ""}
                onChange={handleTechnicianChange}
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                required
              >
                <option value="">Selecciona un técnico</option>
                {technicianOptions.map((technician) => (
                  <option key={technician.keycloakUserId} value={technician.keycloakUserId}>
                    {technician.name}
                    {technician.email ? ` · ${technician.email}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600 sm:col-span-2">
              Fecha y hora
              <input
                type="datetime-local"
                value={formState.scheduledAt}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, scheduledAt: event.target.value }))
                }
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </label>
            <div className="sm:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={formLoading}
                className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {formLoading ? (isEditing ? "Actualizando..." : "Creando...") : isEditing ? "Actualizar visita" : "Crear visita"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingVisitId(null);
                    setFormState({ scheduledAt: "" });
                    setShowForm(false);
                  }}
                  className="rounded border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
          {formSuccess && (
            <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {formSuccess}
            </p>
          )}
          {formError && (
            <p className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </p>
          )}
        </section>
      )}

      {displayError && (
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {displayError}
        </div>
      )}

      <section className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Técnico</th>
              <th className="px-4 py-2 text-left">Programada</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Check-in</th>
              <th className="px-4 py-2 text-left">Check-out</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
            {isLoading && visits.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  Cargando visitas...
                </td>
              </tr>
            )}
            {visits.map((visit) => (
              <tr key={visit.id}>
                <td className="px-4 py-3">{visit.client.name}</td>
                <td className="px-4 py-3">{visit.technician?.name ?? "-"}</td>
                <td className="px-4 py-3">{new Date(visit.scheduledAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs uppercase text-slate-700">
                    {visit.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{visit.checkInAt ? new Date(visit.checkInAt).toLocaleTimeString() : "-"}</td>
                <td className="px-4 py-3 text-xs">{visit.checkOutAt ? new Date(visit.checkOutAt).toLocaleTimeString() : "-"}</td>
                <td className="px-4 py-3">
                  {canManageVisits && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditVisit(visit)}
                        className="rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      {visit.status?.toUpperCase() !== "CANCELED" && (
                        <button
                          type="button"
                          onClick={() => handleCancelVisit(visit)}
                          className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {visits.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  No hay visitas para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
        Vista calendario semanal pendiente de integrar.
      </section>
    </div>
  );
}
