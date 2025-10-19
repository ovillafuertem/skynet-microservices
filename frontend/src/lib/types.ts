export interface ClientSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  status?: string;
  notes?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export type VisitStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | string;

export interface VisitSummary {
  id: string;
  scheduledAt: string;
  windowStart?: string | null;
  windowEnd?: string | null;
  status: VisitStatus;
  notes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  canceledAt?: string | null;
  client: ClientSummary;
  technician?: {
    id: string;
    name: string;
    email?: string | null;
    keycloakUserId?: string;
  } | null;
  teamId?: string | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
}

export interface CreateVisitPayload {
  clientId?: string;
  clientName?: string;
  technicianId?: string;
  technicianName?: string;
  scheduledAt: string;
}

export interface CoordinatesPayload {
  lat: number;
  lng: number;
}

export interface ClientsResponse {
  items: ClientSummary[];
  total?: number;
}
