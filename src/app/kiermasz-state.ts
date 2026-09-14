import "server-only";

import type { Event, EventPhase } from "@/lib/event-utils";
import { getCurrentPhase, phaseLabel } from "@/lib/event-utils";
import { createServiceClient } from "@/lib/supabase/service";
import { formatDayDate } from "./public-catalog-utils";

export type KiermaszPageState = { kind: "selling" } | { kind: "message"; title: string; body: string | null };

export async function resolveKiermaszState(): Promise<KiermaszPageState> {
    const supabase = createServiceClient();

    const { data: events, error: eventsError } = await supabase.from("events").select("*, phases:event_phases(*)").order("created_at", { ascending: false });

    if (eventsError || !events?.length) {
        return {
            kind: "message",
            title: "Kiermasz zakończony",
            body: "Dziękujemy za udział! Zapraszamy ponownie w przyszłym roku szkolnym.",
        };
    }

    const activeEvent = events.find((e) => e.status === "active") as (Event & { phases: EventPhase[] }) | undefined;

    if (activeEvent) {
        const currentPhase = getCurrentPhase(activeEvent.phases);

        if (currentPhase?.phase === "selling") {
            return { kind: "selling" };
        }

        if (currentPhase?.phase === "intake") {
            const sellingPhase = activeEvent.phases.find((p) => p.phase === "selling");
            const startDate = sellingPhase?.starts_at;
            return {
                kind: "message",
                title: "Trwa przyjmowanie podręczników",
                body: startDate ? `Sprzedaż rozpocznie się ${formatDayDate(startDate)}.` : "Termin sprzedaży nie został jeszcze ustalony. Sprawdź wkrótce!",
            };
        }

        if (currentPhase?.phase === "payout") {
            return {
                kind: "message",
                title: "Sprzedaż zakończona",
                body: "Trwa rozliczanie kiermaszu i wypłata środków dla sprzedających.",
            };
        }

        // No current phase — look for next upcoming phase
        const now = new Date().toISOString();
        const upcomingPhases = activeEvent.phases.filter((p): p is EventPhase & { starts_at: string } => p.starts_at !== null && p.starts_at > now).sort((a, b) => a.starts_at.localeCompare(b.starts_at));

        if (upcomingPhases.length > 0) {
            const next = upcomingPhases[0];
            if (next.phase === "selling") {
                return {
                    kind: "message",
                    title: "Sprzedaż rozpocznie się",
                    body: `Sprzedaż podręczników rusza ${formatDayDate(next.starts_at)}. Do zobaczenia!`,
                };
            }
            if (next.phase === "payout") {
                return {
                    kind: "message",
                    title: "Sprzedaż zakończona",
                    body: `Trwa rozliczanie kiermaszu. Wypłaty rozpoczną się ${formatDayDate(next.starts_at)}.`,
                };
            }
            return {
                kind: "message",
                title: "Kiermasz już wkrótce",
                body: `Następny etap (${phaseLabel(next.phase).toLowerCase()}) rozpocznie się ${formatDayDate(next.starts_at)}.`,
            };
        }

        // All phases in the past?
        const allPast = activeEvent.phases.every((p) => p.ends_at && p.ends_at <= now);
        if (allPast || activeEvent.phases.length === 0) {
            return {
                kind: "message",
                title: "Kiermasz zakończony",
                body: "Dziękujemy za udział! Zapraszamy ponownie w przyszłym roku szkolnym.",
            };
        }

        // Event active but no dates configured
        return {
            kind: "message",
            title: "Kiermasz trwa",
            body: "Terminy poszczególnych etapów nie zostały jeszcze ustalone. Sprawdź wkrótce!",
        };
    }

    // No active event — check for planned
    const plannedEvent = events.find((e) => e.status === "planned") as (Event & { phases: EventPhase[] }) | undefined;

    if (plannedEvent) {
        const now = new Date().toISOString();
        const allPhases = plannedEvent.phases.sort((a, b) => (a.starts_at ?? "").localeCompare(b.starts_at ?? ""));
        const earliestPhase = allPhases.find((p) => p.starts_at && p.starts_at > now);

        if (earliestPhase?.starts_at) {
            return {
                kind: "message",
                title: "Kolejny kiermasz jest planowany",
                body: `Kiermasz odbędzie się ${formatDayDate(earliestPhase.starts_at)}. Szczegóły wkrótce!`,
            };
        }

        return {
            kind: "message",
            title: "Kolejny kiermasz jest planowany",
            body: "Szczegóły i terminy pojawią się wkrótce.",
        };
    }

    // Only archived events
    return {
        kind: "message",
        title: "Kiermasz zakończony",
        body: "Dziękujemy za udział! Zapraszamy ponownie w przyszłym roku szkolnym.",
    };
}
