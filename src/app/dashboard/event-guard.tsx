"use client";

import { useEffect, useState } from "react";
import { LogoShield } from "@/components/logo-shield";
import { Button } from "@/components/ui/button";
import { useEventStore } from "@/stores/event-store";
import { useUserStore } from "@/stores/user-store";
import { CreateEventDialog } from "./create-event-dialog";

export function EventGuard({ children }: { children: React.ReactNode }) {
    const { events, selectedEventId, isLoading } = useEventStore();
    const isSuperAdmin = useUserStore((s) => s.isSuperAdmin);
    const initializeEvents = useEventStore((s) => s.initialize);
    const initializeUser = useUserStore((s) => s.initialize);
    const [createOpen, setCreateOpen] = useState(false);

    // biome-ignore lint/correctness/useExhaustiveDependencies: zustand actions are stable references
    useEffect(() => {
        initializeEvents();
        initializeUser();
    }, []);

    if (isLoading) {
        return (
            <div className="flex w-full flex-1 items-center justify-center">
                <LogoShield className="size-12 animate-pulse opacity-50" />
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 text-center">
                <LogoShield className="size-16 opacity-30" />
                <div className="space-y-2">
                    <h2 className="font-heading font-semibold text-lg">Brak wydarzeń</h2>
                    <p className="text-muted-foreground text-sm">Utwórz pierwsze wydarzenie, aby rozpocząć.</p>
                </div>
                {isSuperAdmin && (
                    <>
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                            Dodaj wydarzenie
                        </Button>
                        <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
                    </>
                )}
            </div>
        );
    }

    if (!selectedEventId) {
        return (
            <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 text-center">
                <LogoShield className="size-16 opacity-30" />
                <div className="space-y-2">
                    <h2 className="font-heading font-semibold text-lg">Wybierz wydarzenie</h2>
                    <p className="text-muted-foreground text-sm">Wybierz wydarzenie z listy w panelu bocznym, aby rozpocząć.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
