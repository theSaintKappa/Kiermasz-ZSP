"use client";

import { Calendar02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TableCell, TableRow } from "@/components/ui/table";
import { type EventPhase, phaseLabel } from "@/lib/event-utils";
import { createClient } from "@/lib/supabase/client";

function formatDate(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function toDate(iso: string | null): Date | undefined {
    if (!iso) return undefined;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

interface PhaseEditorProps {
    phase: EventPhase;
    siblings: EventPhase[];
    isSuperAdmin: boolean;
    onSaved: () => Promise<void>;
    className?: string;
}

export function PhaseEditor({ phase, siblings, isSuperAdmin, onSaved, className }: PhaseEditorProps) {
    const [range, setRange] = useState<DateRange>({
        from: toDate(phase.starts_at),
        to: toDate(phase.ends_at),
    });
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const idx = siblings.indexOf(phase);

    const reserved: Array<{ from: Date; to: Date }> = [];
    for (const s of siblings) {
        if (s.id === phase.id) continue;
        const f = toDate(s.starts_at);
        const t = toDate(s.ends_at);
        if (f && t) reserved.push({ from: f, to: t });
    }

    const disabled: Array<{ from: Date; to: Date } | { before: Date } | { after: Date }> = [...reserved];

    if (idx > 0) {
        const prevTo = toDate(siblings[idx - 1].ends_at);
        if (prevTo) disabled.push({ before: prevTo });
    }

    if (idx < siblings.length - 1) {
        const nextFrom = toDate(siblings[idx + 1].starts_at);
        if (nextFrom) disabled.push({ after: nextFrom });
    }

    const handleRangeSelect = (r: DateRange | undefined) => {
        const next = r ?? { from: undefined, to: undefined };
        setRange(next);
        setDirty(true);
        setError(null);
    };

    const handleSave = async () => {
        if (range.from && range.to && range.from >= range.to) {
            setError("Data rozpoczęcia musi być wcześniejsza niż data zakończenia.");
            return;
        }

        setSaving(true);
        setError(null);

        const supabase = createClient();
        const { error: updateError } = await supabase
            .from("event_phases")
            .update({
                starts_at: range.from?.toISOString() ?? null,
                ends_at: range.to?.toISOString() ?? null,
            })
            .eq("id", phase.id);

        if (updateError) {
            setError(updateError.message);
            setSaving(false);
            return;
        }

        setDirty(false);
        setSaving(false);
        await onSaved();
    };

    const handleReset = () => {
        setRange({
            from: toDate(phase.starts_at),
            to: toDate(phase.ends_at),
        });
        setDirty(false);
        setError(null);
    };

    const handleClearDates = async () => {
        setSaving(true);
        const supabase = createClient();
        const { error: clearError } = await supabase.from("event_phases").update({ starts_at: null, ends_at: null }).eq("id", phase.id);

        if (clearError) {
            setError(clearError.message);
            setSaving(false);
            return;
        }

        setRange({ from: undefined, to: undefined });
        setDirty(false);
        setSaving(false);
        await onSaved();
    };

    return (
        <TableRow className={className}>
            <TableCell className="font-medium">{phaseLabel(phase.phase)}</TableCell>
            {isSuperAdmin ? (
                <TableCell>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <Popover>
                                <PopoverTrigger render={<Button variant="outline" size="sm" className="justify-start gap-1 font-normal" disabled={saving} />}>
                                    {range.from ? (
                                        range.to ? (
                                            <>
                                                {formatDate(range.from.toISOString())}
                                                <span className="text-muted-foreground">–</span>
                                                {formatDate(range.to.toISOString())}
                                            </>
                                        ) : (
                                            formatDate(range.from.toISOString())
                                        )
                                    ) : (
                                        <>
                                            <HugeiconsIcon icon={Calendar02Icon} />
                                            <span className="text-muted-foreground">Wybierz zakres</span>
                                        </>
                                    )}
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="range" selected={range} onSelect={handleRangeSelect} disabled={disabled.length > 0 ? disabled : undefined} modifiers={reserved.length > 0 ? { reserved } : undefined} modifiersClassNames={{ reserved: "bg-muted/40 rounded-none" }} autoFocus numberOfMonths={2} />
                                </PopoverContent>
                            </Popover>
                            {phase.starts_at && phase.ends_at && !dirty && (
                                <Button size="icon-sm" variant="ghost" disabled={saving} onClick={handleClearDates}>
                                    <HugeiconsIcon icon={Delete02Icon} />
                                </Button>
                            )}
                            {dirty && (
                                <div className="flex gap-1">
                                    <Button size="sm" variant="outline" disabled={saving} onClick={handleReset}>
                                        Anuluj
                                    </Button>
                                    <Button size="sm" disabled={saving} onClick={handleSave}>
                                        {saving ? "..." : "Zapisz"}
                                    </Button>
                                </div>
                            )}
                        </div>
                        {error && <p className="text-destructive text-xs">{error}</p>}
                    </div>
                </TableCell>
            ) : (
                <TableCell className="text-muted-foreground">
                    <span>{phase.starts_at ? formatDate(phase.starts_at) : "—"}</span>
                    <span className="mx-2">–</span>
                    <span>{phase.ends_at ? formatDate(phase.ends_at) : "—"}</span>
                </TableCell>
            )}
            <TableCell />
        </TableRow>
    );
}
