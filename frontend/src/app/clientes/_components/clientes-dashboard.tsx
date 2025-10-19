"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { ClientMap } from "@/components/maps/client-map";
import type { ClientSummary } from "@/lib/types";
import { hasRequiredRole } from "@/lib/roles";
import { extractRolesFromToken } from "@/lib/token-roles";
import clsx from "clsx";

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const error = new Error("No fue posible cargar clientes");
    throw Object.assign(error, { status: response.status });
  }
  const payload = await response.json();
  return Array.isArray(payload) ? (payload as ClientSummary[]) : (payload.items as ClientSummary[]);
};

interface ClientesDashboardProps {
  initialClients: ClientSummary[];
  initialError: string | null;
}

export default function ClientesDashboard({ initialClients, initialError }: ClientesDashboardProps) {
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id ?? "");
  const { data: session } = useSession();
  const sessionRoles = session?.user.roles?.length ? session.user.roles : extractRolesFromToken(session?.access_token);
  const canEditClient = hasRequiredRole(sessionRoles ?? [], ["supervisor", "admin"]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    const suffix = params.toString();
    return suffix ? `/api/gateway/clients?${suffix}` : "/api/gateway/clients";
  }, [search]);

  const { data, error, isLoading, mutate } = useSWR<ClientSummary[]>(query, fetcher, {
    fallbackData: initialClients,
    revalidateOnFocus: true
  });

  const clients = data ?? [];
  const isCreating = selectedClientId === "new";
  const selectedClient = isCreating
    ? null
    : clients.find((client) => client.id === selectedClientId) ?? null;

  const [formState, setFormState] = useState({
    name: selectedClient?.name ?? "",
    email: selectedClient?.email ?? "",
    phone: selectedClient?.phone ?? "",
    address: selectedClient?.address ?? "",
    status: selectedClient?.status ?? "ACTIVE",
    notes: selectedClient?.notes ?? "",
    lat: selectedClient?.lat?.toString() ?? "",
    lng: selectedClient?.lng?.toString() ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormState({
      name: selectedClient?.name ?? "",
      email: selectedClient?.email ?? "",
      phone: selectedClient?.phone ?? "",
      address: selectedClient?.address ?? "",
      status: selectedClient?.status ?? "ACTIVE",
      notes: selectedClient?.notes ?? "",
      lat: selectedClient?.lat?.toString() ?? "",
      lng: selectedClient?.lng?.toString() ?? ""
    });
  }, [selectedClient?.id, selectedClient?.name, selectedClient?.email, selectedClient?.phone, selectedClient?.address, selectedClient?.status, selectedClient?.notes, selectedClient?.lat, selectedClient?.lng]);

  const handleSelectClient = (client: ClientSummary) => {
    setSelectedClientId(client.id);
    setFormState({
      name: client.name ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      address: client.address ?? "",
      status: client.status ?? "ACTIVE",
      notes: client.notes ?? "",
      lat: client.lat?.toString() ?? "",
      lng: client.lng?.toString() ?? ""
    });
    setFeedback(null);
    setFormError(null);
  };

  const handleCreateNew = () => {
    setSelectedClientId("new");
    setFormState({
      name: "",
      email: "",
      phone: "",
      address: "",
      status: "ACTIVE",
      notes: "",
      lat: "",
      lng: ""
    });
    setFeedback(null);
    setFormError(null);
  };

  const handleSaveClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setFeedback(null);

    const payload: Record<string, unknown> = {
      name: formState.name.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim() || null,
      address: formState.address.trim() || null,
      status: formState.status,
      notes: formState.notes.trim() || null
    };

    const lat = parseFloat(formState.lat);
    const lng = parseFloat(formState.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      payload.lat = lat;
      payload.lng = lng;
    } else if (formState.lat || formState.lng) {
      setFormError("Latitud y longitud deben ser numéricas.");
      setSaving(false);
      return;
    } else {
      payload.lat = null;
      payload.lng = null;
    }

    try {
      const endpoint = isCreating ? "/api/gateway/clients" : `/api/gateway/clients/${selectedClient?.id}`;
      const method = isCreating ? "POST" : "PATCH";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "No se pudo actualizar el cliente.");
      }
      const saved = await response.json();
      await mutate();
      setFeedback(isCreating ? "Cliente creado correctamente." : "Cliente actualizado correctamente.");
      if (saved?.id) {
        setSelectedClientId(saved.id);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar el cliente.");
    } finally {
      setSaving(false);
    }
  };

  const displayError = error ? "No fue posible cargar la información" : initialError;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <section className="space-y-4">
        <header className="rounded-lg bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Clientes</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o dirección"
              className="w-full flex-1 rounded border border-slate-200 px-3 py-2 text-sm"
            />
            {canEditClient && (
              <button
                type="button"
                onClick={handleCreateNew}
                className="rounded bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
              >
                Nuevo cliente
              </button>
            )}
          </div>
        </header>

        {displayError && (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {displayError}
          </div>
        )}

        <ul className="space-y-2">
          {isLoading && clients.length === 0 && (
            <li className="h-16 animate-pulse rounded bg-slate-200" />
          )}
          {clients.map((client) => (
            <li key={client.id}>
              <button
                onClick={() => handleSelectClient(client)}
                className={`w-full rounded border px-4 py-3 text-left text-sm transition ${
                  client.id === selectedClientId
                    ? "border-accent bg-cyan-50"
                    : "border-slate-200 bg-white hover:border-accent"
                }`}
              >
                <p className="font-semibold text-slate-900">{client.name}</p>
                <p className="text-xs text-slate-600">{client.address ?? "Sin dirección"}</p>
              </button>
            </li>
          ))}
          {clients.length === 0 && !isLoading && (
            <li className="rounded border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
              No se encontraron clientes.
            </li>
          )}
        </ul>
      </section>

      <section className="space-y-4">
        {selectedClient || isCreating ? (
          <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                {isCreating ? "Nuevo cliente" : selectedClient?.name}
              </h2>
              {!isCreating && (
                <div className="space-y-1 text-xs text-slate-600">
                  <p>{selectedClient?.address ?? "Sin dirección"}</p>
                  <p>Correo: {selectedClient?.email ?? "-"}</p>
                  <p>Teléfono: {selectedClient?.phone ?? "-"}</p>
                  <p>Estatus: {selectedClient?.status ?? "-"}</p>
                </div>
              )}
            </header>
            {!isCreating && selectedClient?.lat != null && selectedClient?.lng != null ? (
              <div className="space-y-3">
                <ClientMap lat={selectedClient.lat} lng={selectedClient.lng} label="Cliente" />
                <button
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedClient.lat},${selectedClient.lng}`,
                      "_blank"
                    )
                  }
                  className="w-full rounded border border-accent px-3 py-2 text-sm font-semibold text-accent transition hover:bg-cyan-50"
                >
                  Cómo llegar
                </button>
              </div>
            ) : (
              <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Este cliente no tiene coordenadas guardadas.
              </div>
            )}

            {canEditClient && (
              <form className="space-y-3" onSubmit={handleSaveClient}>
                <h3 className="text-sm font-semibold text-slate-900">Editar cliente</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs uppercase text-slate-500">
                    Nombre
                    <input
                      type="text"
                      value={formState.name}
                      onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                      required
                    />
                  </label>
                  <label className="text-xs uppercase text-slate-500">
                    Email
                    <input
                      type="email"
                      value={formState.email}
                      onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                      required
                    />
                  </label>
                  <label className="text-xs uppercase text-slate-500">
                    Teléfono
                    <input
                      type="text"
                      value={formState.phone}
                      onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs uppercase text-slate-500">
                    Dirección
                    <input
                      type="text"
                      value={formState.address}
                      onChange={(event) => setFormState((prev) => ({ ...prev, address: event.target.value }))}
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs uppercase text-slate-500">
                    Estado
                    <select
                      value={formState.status}
                      onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                    </select>
                  </label>
                  <label className="text-xs uppercase text-slate-500">
                    Notas
                    <textarea
                      value={formState.notes}
                      onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                      rows={3}
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs uppercase text-slate-500">
                    Latitud
                    <input
                      type="text"
                      value={formState.lat}
                      onChange={(event) => setFormState((prev) => ({ ...prev, lat: event.target.value }))}
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs uppercase text-slate-500">
                    Longitud
                    <input
                      type="text"
                      value={formState.lng}
                      onChange={(event) => setFormState((prev) => ({ ...prev, lng: event.target.value }))}
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className={clsx(
                    "rounded px-4 py-2 text-sm font-semibold text-white",
                    saving ? "bg-slate-300" : "bg-slate-900 hover:bg-slate-800"
                  )}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                {feedback && (
                  <p className="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">
                    {feedback}
                  </p>
                )}
                {formError && (
                  <p className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                    {formError}
                  </p>
                )}
              </form>
            )}
          </div>
        ) : (
          <div className="rounded border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
            Selecciona un cliente para ver sus detalles.
          </div>
        )}
      </section>
    </div>
  );
}
