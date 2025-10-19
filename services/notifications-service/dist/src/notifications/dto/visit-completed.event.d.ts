export declare class VisitPartyDto {
    name: string;
    email?: string | null;
}
export declare class VisitCompletedEventDto {
    visitId: string;
    completedAtIso: string;
    client: VisitPartyDto;
    technician: VisitPartyDto;
    notes?: string | null;
    address?: string | null;
    summaryHtml?: string | null;
}
export type VisitCompletedPayload = VisitCompletedEventDto;
