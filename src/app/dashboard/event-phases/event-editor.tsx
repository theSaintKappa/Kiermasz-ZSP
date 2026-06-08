"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type EventPhase, type EventStatus, statusLabel } from "@/lib/event-utils";
import { createClient } from "@/lib/supabase/client";
import { useEventStore } from "@/stores/event-store";
import { PhaseEditor } from "./phase-editor";

export function EventEditor({ event, phases, isSuperAdmin }: { event: { id: string; name: string; status: EventStatus }; phases: EventPhase[]; isSuperAdmin: boolean }) {
    const { refreshEvents } = useEventStore();
    const [savingStatus, setSavingStatus] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<EventStatus | null>(null);

    const handleStatusChange = async (status: EventStatus) => {
        setSavingStatus(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from("events").update({ status }).eq("id", event.id);

            if (error) {
                console.error("Failed to update event status:", error.message);
                setSavingStatus(false);
                setPendingStatus(null);
                return;
            }

            setSavingStatus(false);
            setPendingStatus(null);
            await refreshEvents();
        } catch (err) {
            console.error("Error updating event status:", err);
            setSavingStatus(false);
            setPendingStatus(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                {isSuperAdmin && (
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">Status:</span>
                        <ToggleGroup value={[event.status]} onValueChange={(v) => v[0] && setPendingStatus(v[0] as EventStatus)} variant="default">
                            {(["planned", "active", "archived"] as EventStatus[]).map((s) => (
                                <ToggleGroupItem key={s} value={s} disabled={savingStatus} className={s === event.status ? "bg-primary! text-primary-foreground!" : ""}>
                                    {statusLabel(s)}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>
                )}
            </div>
            <div className="w-full overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-accent hover:bg-accent">
                            <TableHead>Faza</TableHead>
                            <TableHead>Termin</TableHead>
                            <TableHead className="sr-only">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {phases.map((phase) => (
                            <PhaseEditor key={phase.id} phase={phase} siblings={phases} isSuperAdmin={isSuperAdmin} onSaved={refreshEvents} className="bg-muted/30" />
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!pendingStatus} onOpenChange={() => setPendingStatus(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Zmiana statusu</DialogTitle>
                        <DialogDescription>Czy na pewno chcesz zmienić status wydarzenia na „{pendingStatus ? statusLabel(pendingStatus) : ""}”?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPendingStatus(null)}>
                            Anuluj
                        </Button>
                        <Button onClick={() => pendingStatus && handleStatusChange(pendingStatus)}>Zmień</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
