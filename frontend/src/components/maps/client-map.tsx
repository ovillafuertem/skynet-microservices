"use client";

import { useMemo } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { googleMapsApiKey } from "@/lib/env";

interface ClientMapProps {
  lat?: number | null;
  lng?: number | null;
  label?: string;
}

export function ClientMap({ lat, lng, label }: ClientMapProps) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const center = useMemo(() => (hasCoords ? { lat: lat!, lng: lng! } : undefined), [hasCoords, lat, lng]);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    id: "skynet-map",
    libraries: ["places"]
  });

  if (!hasCoords) {
    return <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">Este cliente no tiene coordenadas guardadas.</div>;
  }

  if (loadError) {
    return <div className="rounded border border-red-200 bg-red-50 p-4 text-xs text-red-700">Error al cargar el mapa. Revisa la API key de Google Maps.</div>;
  }

  if (!isLoaded || !center) {
    return <div className="h-64 animate-pulse rounded bg-slate-200" />;
  }

  return (
    <div className="h-64 overflow-hidden rounded">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={15}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        <Marker position={center} label={label}
        />
      </GoogleMap>
    </div>
  );
}
