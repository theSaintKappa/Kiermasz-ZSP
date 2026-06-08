"use client";

import type { EventPhaseType } from "@/lib/event-utils";
import { useEventStore, useSelectedEvent } from "@/stores/event-store";
import { useUserStore } from "@/stores/user-store";
import { EventEditor } from "./event-editor";

const phaseOrder: EventPhaseType[] = ["not_started", "intake", "selling", "payout", "finished"];

export default function EventsPage() {
    const isSuperAdmin = useUserStore((s) => s.isSuperAdmin);
    const selectedEvent = useSelectedEvent();
    const events = useEventStore((s) => s.events);

    if (!selectedEvent) {
        return (
            <div className="flex w-full items-center justify-center py-24">
                <p className="text-muted-foreground text-sm">Wybierz wydarzenie w panelu bocznym.</p>
            </div>
        );
    }

    const sortedPhases = [...selectedEvent.phases].sort((a, b) => phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase));

    const hasOtherActiveEvent = events.some((e) => e.id !== selectedEvent.id && e.status === "active");

    return (
        <div className="flex w-full flex-col gap-6">
            <EventEditor event={selectedEvent} phases={sortedPhases} isSuperAdmin={isSuperAdmin} hasOtherActiveEvent={hasOtherActiveEvent} />
        </div>
    );
}
