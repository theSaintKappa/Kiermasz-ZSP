export type EventStatus = "planned" | "active" | "archived";

export type EventPhaseType = "not_started" | "intake" | "selling" | "payout" | "finished";

export interface Event {
    id: string;
    name: string;
    status: EventStatus;
    created_at: string;
    phases: EventPhase[];
}

export interface EventPhase {
    id: string;
    event_id: string;
    phase: EventPhaseType;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
}

const STATUS_LABELS: Record<EventStatus, string> = {
    planned: "Zaplanowany",
    active: "Aktywny",
    archived: "Zarchiwizowany",
};

const PHASE_LABELS: Record<EventPhaseType, string> = {
    not_started: "Nie rozpoczęto",
    intake: "Przyjmowanie",
    selling: "Sprzedaż",
    payout: "Wypłaty",
    finished: "Zakończono",
};

export function statusLabel(status: EventStatus): string {
    return STATUS_LABELS[status];
}

export function phaseLabel(phase: EventPhaseType): string {
    return PHASE_LABELS[phase];
}

export function getCurrentPhase(phases: EventPhase[]): EventPhase | null {
    const now = new Date().toISOString();

    for (const p of phases) if (p.starts_at && p.starts_at <= now && (!p.ends_at || p.ends_at > now)) return p;

    return null;
}
