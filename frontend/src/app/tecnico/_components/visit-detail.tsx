"use client";

import { useCallback, useState } from "react";
import { ClientMap } from "@/components/maps/client-map";
import type { VisitSummary } from "@/lib/types";

interface VisitDetailProps {
  visit: VisitSummary;
  onChange: () => Promise<VisitSummary[] | undefined>;
}

type ActionType = "check-in" | "check-out" | "complete";

function translateBackendMessage(raw: string): string {
  const normalized = raw.toLowerCase();
  if (normalized.includes("outside check-in time")) {
    return "La visita todavía no está dentro de la ventana para hacer check-in.";
  }
  if (normalized.includes("outside check-out time")) {
    return "No puedes registrar el check-out todavía (fuera del horario permitido).";
  }
  if (normalized.includes("visit already has check-in")) {
    return "La visita ya tiene un check-in registrado.";
  }
  if (normalized.includes("visit already has check-out")) {
    return "La visita ya tiene un check-out registrado.";
  }
  if (normalized.includes("not assigned to this visit")) {
    return "Esta visita está asignada a otro técnico.";
  }
  if (normalized.includes("technician profile not found")) {
    return "Tu usuario aún no está vinculado como técnico. Cierra sesión y vuelve a ingresar o avisa al supervisor.";
  }
  if (normalized.includes("cannot check-out without a prior check-in")) {
    return "Debes registrar primero el check-in antes de hacer check-out.";
  }
  if (normalized.includes("outside geofence")) {
    return "No estás cerca de la ubicación registrada del cliente.";
  }
  if (normalized.includes("client is inactive")) {
    return "El cliente está marcado como inactivo, consulta a tu supervisor.";
  }
  return raw;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

async function requestCoordinates(): Promise<{ lat: number; lng: number }> {
  if (!("geolocation" in navigator)) {
    throw new Error("El navegador no soporta geolocalización");
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ lat: latitude, lng: longitude });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Debes permitir el acceso a tu ubicación para continuar."));
            break;
          case error.TIMEOUT:
            reject(new Error("No se pudo obtener la ubicación a tiempo. Intenta nuevamente."));
            break;
          default:
            reject(new Error("No se pudo obtener la ubicación."));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export function VisitDetail({ visit, onChange }: VisitDetailProps) {
  const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performAction = useCallback(
    async (type: ActionType) => {
      setLoadingAction(type);
      setFeedback(null);
      setError(null);
      try {
        const endpoint =
          type === "check-in"
            ? `/api/gateway/visits/${visit.id}/check-in`
            : type === "check-out"
              ? `/api/gateway/visits/${visit.id}/check-out`
              : `/api/gateway/visits/${visit.id}/complete`;

        const requestInit: RequestInit = { method: "POST" };

        if (type === "check-in" || type === "check-out") {
          const coords = await requestCoordinates();
          requestInit.headers = { "Content-Type": "application/json" };
          requestInit.body = JSON.stringify(coords);
        }

        const response = await fetch(endpoint, requestInit);
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("No autorizado. Actualiza tu sesión.");
          }
          let message = "La operación no se pudo completar.";
          try {
            const data = await response.json();
            const raw = typeof data?.message === "string" ? data.message : JSON.stringify(data);
            message = translateBackendMessage(raw);
          } catch {
            const text = await response.text();
            if (text) message = translateBackendMessage(text);
          }
          throw new Error(message);
        }

        setFeedback(
          type === "check-in"
            ? "Check-in registrado correctamente."
            : type === "check-out"
              ? "Check-out registrado. ¡Buen trabajo!"
              : "Visita finalizada. El cliente recibirá su reporte."
        );
        await onChange();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Operación fallida.");
      } finally {
        setLoadingAction(null);
      }
    },
    [onChange, visit.id]
  );

  const hasCoordinates = visit.client.lat != null && visit.client.lng != null;
  const normalizedStatus = (visit.status ?? "").toUpperCase();
  const hasCheckIn = Boolean(visit.checkInAt);
  const hasCheckOut = Boolean(visit.checkOutAt);
  const isCompleted = normalizedStatus === "DONE" || normalizedStatus === "COMPLETED";
  const isCanceled = normalizedStatus === "CANCELED";

  const isCheckInDisabled = loadingAction === "check-in" || hasCheckIn || isCompleted || isCanceled;
  const isCheckOutDisabled =
    loadingAction === "check-out" || !hasCheckIn || hasCheckOut || isCompleted || isCanceled;
  const isCompleteDisabled =
    loadingAction === "complete" || !hasCheckOut || isCompleted || isCanceled;

  return (
    <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{visit.client.name}</h2>
          <div className="text-xs text-slate-600 space-y-1">
            <p>{visit.client.address ?? "Sin dirección registrada"}</p>
            <p>Correo: {visit.client.email ?? "-"}</p>
            <p>Teléfono: {visit.client.phone ?? "-"}</p>
            {visit.client.notes && <p>Notas del cliente: {visit.client.notes}</p>}
          </div>
        </div>
        <span className="rounded bg-slate-100 px-3 py-1 text-xs font-medium uppercase text-slate-700">
          {visit.status}
        </span>
      </div>

      {hasCoordinates ? (
        <div className="space-y-2">
          <ClientMap lat={visit.client.lat!} lng={visit.client.lng!} label="Cliente" />
          <button
            onClick={() => {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${visit.client.lat},${visit.client.lng}`;
              window.open(url, "_blank");
            }}
            className="w-full rounded border border-accent px-3 py-2 text-sm font-semibold text-accent transition hover:bg-cyan-50"
          >
            Cómo llegar
          </button>
        </div>
      ) : (
        <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          Este cliente no tiene coordenadas registradas. Solicita al supervisor que las capture.
        </div>
      )}

      <dl className="grid grid-cols-2 gap-4 text-xs text-slate-600">
        <div>
          <dt className="font-semibold text-slate-900">Programada</dt>
          <dd>{formatDateTime(visit.scheduledAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">Check-in</dt>
          <dd>{formatDateTime(visit.checkInAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-900">Check-out</dt>
          <dd>{formatDateTime(visit.checkOutAt)}</dd>
        </div>
        {visit.client.status && (
          <div>
            <dt className="font-semibold text-slate-900">Estado del cliente</dt>
            <dd>{visit.client.status}</dd>
          </div>
        )}
      </dl>

      {visit.notes && (
        <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <p className="font-semibold text-slate-900">Notas de la visita</p>
          <p>{visit.notes}</p>
        </div>
      )}

      <div className="space-y-2">
        <button
          disabled={isCheckInDisabled}
          onClick={() => performAction("check-in")}
          className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loadingAction === "check-in" ? "Registrando check-in..." : "Check-in"}
        </button>
        <button
          disabled={isCheckOutDisabled}
          onClick={() => performAction("check-out")}
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loadingAction === "check-out" ? "Registrando check-out..." : "Check-out"}
        </button>
        <button
          disabled={isCompleteDisabled}
          onClick={() => performAction("complete")}
          className="w-full rounded bg-accent px-3 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loadingAction === "complete" ? "Finalizando visita..." : "Finalizar visita"}
        </button>
      </div>

      {feedback && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {feedback}
        </div>
      )}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
