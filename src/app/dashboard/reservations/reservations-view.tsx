"use client";

import { AlertCircleIcon, CryingIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { getCurrentPhase } from "@/lib/event-utils";
import { useEventStore } from "@/stores/event-store";
import { CancelReservationDialog } from "./cancel-reservation-dialog";
import { FulfillReservationDialog } from "./fulfill-reservation-dialog";
import { ReservationCard } from "./reservation-card";
import { expiryDayKey, expiryDayLabel, type ReservationRow, reservationCountLabel } from "./reservations-utils";

interface ReservationsViewProps {
    reservations: ReservationRow[];
}

export function ReservationsView({ reservations }: ReservationsViewProps) {
    const router = useRouter();
    const selectedEventId = useEventStore((s) => s.selectedEventId);
    const events = useEventStore((s) => s.events);
    const event = events.find((e) => e.id === selectedEventId);

    const currentPhase = event ? getCurrentPhase(event.phases) : null;
    const isSellingPhase = currentPhase?.phase === "selling";

    const [fulfillTarget, setFulfillTarget] = useState<ReservationRow | null>(null);
    const [cancelTarget, setCancelTarget] = useState<ReservationRow | null>(null);

    // Realtime: refresh when textbook_items change (covers all reservation lifecycle transitions)
    useEffect(() => {
        if (!selectedEventId) return;
        const { createClient } = require("@/lib/supabase/client");
        const supabase = createClient();

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const channel = supabase
            .channel("reservations-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "textbook_items", filter: `event_id=eq.${selectedEventId}` }, () => {
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => router.refresh(), 500);
            })
            .subscribe();

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            supabase.removeChannel(channel);
        };
    }, [selectedEventId, router]);

    // Group by expiry day
    const groups = useMemo(() => {
        const map = new Map<string, ReservationRow[]>();
        for (const r of reservations) {
            const key = expiryDayKey(r.expiresAt);
            const arr = map.get(key);
            if (arr) arr.push(r);
            else map.set(key, [r]);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [reservations]);

    return (
        <div className="flex w-full flex-col gap-4">
            {/* Phase warning */}
            {event && !isSellingPhase && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-sm dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0" />
                    Faza sprzedaży nie jest aktywna. Transakcje są nadal możliwe.
                </div>
            )}

            {/* Reservation list */}
            {reservations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <HugeiconsIcon icon={CryingIcon} className="mb-3 size-8 opacity-30" />
                    <p className="text-sm">Brak aktywnych rezerwacji.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    {groups.map(([dayKey, groupReservations]) => (
                        <section key={dayKey}>
                            <h3 className="mb-3 flex items-end justify-between font-semibold text-lg">
                                {expiryDayLabel(groupReservations[0].expiresAt)}
                                <span className="font-normal text-muted-foreground text-sm">
                                    {groupReservations.length} {reservationCountLabel(groupReservations.length)}
                                </span>
                            </h3>
                            <Separator className="mb-4" />
                            <div className="flex flex-col gap-3">
                                {groupReservations.map((r) => (
                                    <ReservationCard key={r.id} reservation={r} onFulfill={setFulfillTarget} onCancel={setCancelTarget} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <FulfillReservationDialog
                open={!!fulfillTarget}
                onOpenChange={(open) => {
                    if (!open) setFulfillTarget(null);
                }}
                reservation={fulfillTarget}
            />
            <CancelReservationDialog
                open={!!cancelTarget}
                onOpenChange={(open) => {
                    if (!open) setCancelTarget(null);
                }}
                reservation={cancelTarget}
            />
        </div>
    );
}
