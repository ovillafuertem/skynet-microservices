export interface VisitCompletedEvent {
  visitId: string;
  completedAtIso: string;
  client: {
    name: string;
    email?: string | null;
    address?: string | null;
  };
  technician: {
    name: string;
    email?: string | null;
  };
  notes?: string | null;
  summaryHtml?: string | null;
}
