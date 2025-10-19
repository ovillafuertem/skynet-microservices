"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { VisitSummary } from "@/lib/types";
import { VisitDetail } from "./visit-detail";

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const error = new Error("No fue posible cargar las visitas");
    throw Object.assign(error, { status: response.status });
  }
  return (await response.json()) as VisitSummary[];
};

interface TecnicoDashboardProps {
  initialVisits: VisitSummary[];
  initialError: string | null;
}

export default function TecnicoDashboard({ initialVisits, initialError }: TecnicoDashboardProps) {
  const { data, error, isLoading, mutate } = useSWR<VisitSummary[]>(
    "/api/gateway/visits/today",
    fetcher,
    {
      fallbackData: initialVisits,
      revalidateOnFocus: true
    }
  );

  const visits = useMemo(() => data ?? [], [data]);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(visits[0]?.id ?? null);
  const selectedVisit = useMemo(
    () => visits.find((visit) => visit.id === selectedVisitId) ?? null,
    [visits, selectedVisitId]
  );

  useEffect(() => {
    if (visits.length === 0) {
      setSelectedVisitId(null);
      return;
    }
    if (!selectedVisitId || !visits.some((visit) => visit.id === selectedVisitId)) {
      setSelectedVisitId(visits[0]?.id ?? null);
    }
  }, [visits, selectedVisitId]);

  const displayError = error ? "No fue posible obtener tus visitas." : initialError;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Mis visitas de hoy</h1>
          <button
            onClick={() => mutate()}
            className="text-sm text-accent hover:underline"
          >
            Recargar
          </button>
        </div>
        {isLoading && visits.length === 0 && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        )}
        {displayError && (
          <div className="mb-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {displayError}
          </div>
        )}
        <ul className="space-y-3">
          {visits.map((visit) => (
            <li key={visit.id}>
              <button
                onClick={() => setSelectedVisitId(visit.id)}
                className={`w-full rounded border p-4 text-left transition ${
                  visit.id === selectedVisitId
                    ? "border-accent bg-cyan-50"
                    : "border-slate-200 bg-white hover:border-accent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{visit.client.name}</p>
                    <p className="text-xs text-slate-600">{new Date(visit.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs uppercase text-slate-700">
                    {visit.status}
                  </span>
                </div>
              </button>
            </li>
          ))}
          {visits.length === 0 && !isLoading && (
            <li className="rounded border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
              No tienes visitas asignadas para hoy.
            </li>
          )}
        </ul>
      </section>
      <section>
        {selectedVisit ? (
          <VisitDetail visit={selectedVisit} onChange={mutate} />
        ) : (
          <div className="rounded border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
            Selecciona una visita para ver los detalles.
          </div>
        )}
      </section>
    </div>
  );
}
