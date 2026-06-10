"use client";

import { Alert02Icon, CircleEllipsisIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type EventPhase, type EventStatus, statusLabel } from "@/lib/event-utils";
import { createClient } from "@/lib/supabase/client";
import { useEventStore } from "@/stores/event-store";
import { PhaseEditor } from "./phase-editor";

export function EventEditor({ event, phases, isSuperAdmin, hasOtherActiveEvent }: { event: { id: string; name: string; status: EventStatus }; phases: EventPhase[]; isSuperAdmin: boolean; hasOtherActiveEvent: boolean }) {
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
            {isSuperAdmin && (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <HugeiconsIcon icon={CircleEllipsisIcon} strokeWidth={2} className="size-4" />
                        <span className="font-medium text-xs">Status wydarzenia</span>
                    </div>

                    <ToggleGroup value={[event.status]} onValueChange={(v) => v[0] && setPendingStatus(v[0] as EventStatus)} variant="outline">
                        {(["planned", "active", "archived"] as EventStatus[]).map((s) => {
                            const disabled = savingStatus || (s === "active" && hasOtherActiveEvent);
                            if (s === "active" && hasOtherActiveEvent) {
                                return (
                                    <Tooltip key={s}>
                                        <TooltipTrigger render={<span />}>
                                            <ToggleGroupItem value={s} disabled={disabled} size="sm" className={s === event.status ? "bg-primary! text-primary-foreground!" : ""}>
                                                {statusLabel(s)}
                                            </ToggleGroupItem>
                                        </TooltipTrigger>
                                        <TooltipContent>Już istnieje jedno aktywne wydarzenie</TooltipContent>
                                    </Tooltip>
                                );
                            }
                            return (
                                <ToggleGroupItem key={s} value={s} disabled={disabled} size="sm" className={s === event.status ? "bg-primary! text-primary-foreground!" : ""}>
                                    {statusLabel(s)}
                                </ToggleGroupItem>
                            );
                        })}
                    </ToggleGroup>
                </div>
            )}
            <div className="w-full overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead>Faza</TableHead>
                            <TableHead>Termin</TableHead>
                            <TableHead className="sr-only">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {phases.map((phase) => (
                            <PhaseEditor key={phase.id} phase={phase} siblings={phases} isSuperAdmin={isSuperAdmin} onSaved={refreshEvents} className="bg-muted/10 hover:bg-muted/20" />
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!pendingStatus} onOpenChange={() => setPendingStatus(null)}>
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogMedia>
                            <HugeiconsIcon icon={Alert02Icon} />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Zmiana statusu</AlertDialogTitle>
                        <AlertDialogDescription>
                            Czy na pewno chcesz zmienić status wydarzenia na "<span className="font-medium text-foreground">{pendingStatus && statusLabel(pendingStatus)}</span>"?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel variant="outline" onClick={() => setPendingStatus(null)}>
                            Anuluj
                        </AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => pendingStatus && handleStatusChange(pendingStatus)} disabled={savingStatus}>
                            Zmień
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
