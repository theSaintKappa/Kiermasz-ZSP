"use client";

import { ArrowDown01Icon, ArrowRight01Icon, ArrowUp01Icon, Delete02Icon, Edit03Icon, PlusSignCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { LogRow } from "./logs-utils";

interface FieldChange {
    field: string;
    old: unknown;
    new: unknown;
}

function formatVal(value: unknown): string {
    if (value === null || value === undefined) return "null";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Date(value).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
    }
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

export function computeDiff(oldValues: Record<string, unknown> | null, newValues: Record<string, unknown> | null): FieldChange[] {
    if (!oldValues && !newValues) return [];

    if (!oldValues && newValues) {
        return Object.entries(newValues)
            .filter(([key]) => key !== "id" && key !== "created_at")
            .map(([field, value]) => ({ field, old: null, new: value }));
    }

    if (oldValues && !newValues) {
        return Object.entries(oldValues)
            .filter(([key]) => key !== "id" && key !== "created_at")
            .map(([field, value]) => ({ field, old: value, new: null }));
    }

    const allKeys = new Set([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})]);
    const changes: FieldChange[] = [];

    for (const key of allKeys) {
        if (key === "id" || key === "created_at") continue;
        if (JSON.stringify(oldValues?.[key]) !== JSON.stringify(newValues?.[key])) {
            changes.push({ field: key, old: oldValues?.[key], new: newValues?.[key] });
        }
    }

    return changes;
}

function DiffPopover({ changes, action }: { changes: FieldChange[]; action: string }) {
    if (changes.length === 0) return <span className="text-muted-foreground">—</span>;

    const first = changes[0];
    const rest = changes.length - 1;

    const isInsert = action === "INSERT";
    const isDelete = action === "DELETE";

    return (
        <Popover>
            <PopoverTrigger render={<button type="button" className="flex cursor-pointer items-center gap-1 text-left text-sm hover:underline" />}>
                {isInsert ? (
                    <span className="text-emerald-400">Utworzono rekord</span>
                ) : isDelete ? (
                    <span className="text-red-400">Usunięto rekord</span>
                ) : (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="italic">
                            {first.field}
                        </Badge>
                        <span className="font-mono text-muted-foreground line-through">"{formatVal(first.old)}"</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                        <span className="font-mono text-blue-400">"{formatVal(first.new)}"</span>
                    </div>
                )}
                {rest > 0 && <span className="ml-0.5 whitespace-nowrap text-muted-foreground text-xs">+{rest} więcej</span>}
            </PopoverTrigger>
            <PopoverContent className="max-h-80 w-80 gap-1 overflow-y-auto">
                <PopoverHeader>
                    <PopoverTitle>{isInsert ? "Nowy rekord:" : isDelete ? "Usunięty rekord:" : "Zmienione pola:"}</PopoverTitle>
                </PopoverHeader>
                {changes.map((c) => (
                    <div key={c.field} className="flex items-center gap-1 font-mono text-xs">
                        <span className="font-medium text-muted-foreground italic">{c.field}:</span>
                        {isInsert ? (
                            <span className="text-emerald-400">"{formatVal(c.new)}"</span>
                        ) : isDelete ? (
                            <span className="text-red-400">"{formatVal(c.old)}"</span>
                        ) : (
                            <>
                                <span className="line-through">"{formatVal(c.old)}"</span>
                                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                                <span className="text-blue-400">"{formatVal(c.new)}"</span>
                            </>
                        )}
                    </div>
                ))}
            </PopoverContent>
        </Popover>
    );
}

function ActionBadge({ action }: { action: string }) {
    const Icon = action === "INSERT" ? PlusSignCircleIcon : action === "DELETE" ? Delete02Icon : Edit03Icon;
    const label = action === "INSERT" ? "Dodanie" : action === "DELETE" ? "Usunięcie" : "Edycja";

    return (
        <Badge className={cn(action === "UPDATE" && "border-blue-500/30 bg-blue-500/10 text-blue-400", action === "INSERT" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400", action === "DELETE" && "border-red-500/30 bg-red-500/10 text-red-400")}>
            <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-3" />
            {label}
        </Badge>
    );
}

export const columns: ColumnDef<LogRow>[] = [
    {
        accessorKey: "adminName",
        header: "Użytkownik",
        cell: ({ getValue }) => {
            const name = getValue<string | null>();
            return <span className={cn("text-sm", !name && "text-muted-foreground italic")}>{name || "System"}</span>;
        },
    },
    {
        accessorKey: "action",
        header: "Akcja",
        cell: ({ getValue }) => <ActionBadge action={getValue<string>()} />,
    },
    {
        accessorKey: "tableName",
        header: "Tabela",
        cell: ({ row }) => (
            <span className="inline-flex items-center gap-1.5">
                <Badge variant="secondary">{row.original.tableName}</Badge>
                {row.original.eventId === null && <span className="text-xs">global</span>}
            </span>
        ),
    },
    {
        id: "changes",
        header: "Zmiany",
        cell: ({ row }) => {
            const { oldValues, newValues, action } = row.original;
            const changes = computeDiff(oldValues, newValues);
            return <DiffPopover changes={changes} action={action} />;
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            return (
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Data
                    {column.getIsSorted() === "desc" ? <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3.5" /> : column.getIsSorted() === "asc" ? <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-3.5" /> : null}
                </Button>
            );
        },
        cell: ({ getValue }) => {
            const value = getValue<string>();
            if (!value) return <span className="text-muted-foreground">—</span>;
            return <span className="whitespace-nowrap text-muted-foreground text-sm">{new Date(value).toLocaleString("pl-PL", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>;
        },
    },
];
