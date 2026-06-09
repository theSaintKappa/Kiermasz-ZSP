"use client";

import { FilterIcon, MultiplicationSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { useSelectedEvent } from "@/stores/event-store";
import { columns, type LogRow } from "./columns";
import { LogsTable } from "./logs-table";

interface LogsViewProps {
    logs: LogRow[];
    profileOptions: { id: string; name: string }[];
    actionOptions: string[];
    tableOptions: string[];
}

interface RealtimeLogPayload {
    id: string;
    admin_id: string | null;
    action: string;
    table_name: string;
    record_id: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    created_at: string;
    event_id: string | null;
}

export function LogsView({ logs: initialLogs, profileOptions, actionOptions, tableOptions }: LogsViewProps) {
    const event = useSelectedEvent();
    const eventRef = useRef(event);
    eventRef.current = event;

    const [logs, setLogs] = useState<LogRow[]>(initialLogs);
    const [adminFilter, setAdminFilter] = useState<string>("");
    const [actionFilter, setActionFilter] = useState<string>("");
    const [tableFilter, setTableFilter] = useState<string>("");

    useEffect(() => {
        const supabase = createClient();

        const channel = supabase
            .channel("audit-logs-realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "audit_logs",
                },
                (payload: { new: RealtimeLogPayload }) => {
                    const raw = payload.new;
                    const currentEvent = eventRef.current;
                    const belongsToEvent = raw.event_id !== null && currentEvent && raw.event_id === currentEvent.id;

                    if (raw.event_id !== null && !belongsToEvent) return;

                    const profile = profileOptions.find((p) => p.id === raw.admin_id);
                    const adminName = profile?.name ?? null;

                    const newLog: LogRow = {
                        id: raw.id,
                        adminName,
                        action: raw.action,
                        tableName: raw.table_name,
                        recordId: raw.record_id,
                        oldValues: raw.old_values,
                        newValues: raw.new_values,
                        createdAt: raw.created_at,
                        eventId: raw.event_id,
                    };

                    setLogs((prev) => [newLog, ...prev]);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profileOptions]);

    const filteredLogs = logs.filter((log) => {
        if (event && log.eventId !== null && log.eventId !== event.id) return false;
        if (adminFilter && log.adminName !== adminFilter) return false;
        if (actionFilter && log.action !== actionFilter) return false;
        if (tableFilter && log.tableName !== tableFilter) return false;
        return true;
    });

    const hasFilters = adminFilter !== "" || actionFilter !== "" || tableFilter !== "";

    const handleClearFilters = () => {
        setAdminFilter("");
        setActionFilter("");
        setTableFilter("");
    };

    return (
        <div className="flex w-full flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <HugeiconsIcon icon={FilterIcon} strokeWidth={2} className="size-4" />
                    <span className="font-medium text-xs">Filtry</span>
                </div>

                <Select value={adminFilter} onValueChange={(v) => setAdminFilter(v ?? "")}>
                    <SelectTrigger size="sm" className="min-w-40">
                        <SelectValue>{(value: string) => (value ? profileOptions.find((p) => p.name === value)?.name : "Wszyscy użytkownicy")}</SelectValue>
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start">
                        <SelectItem value="">Wszyscy użytkownicy</SelectItem>
                        {profileOptions.map((p) => (
                            <SelectItem key={p.id} value={p.name}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={actionFilter} onValueChange={(v) => setActionFilter(v ?? "")}>
                    <SelectTrigger size="sm" className="min-w-35">
                        <SelectValue>{(value: string) => (value ? (value === "INSERT" ? "Dodanie" : value === "DELETE" ? "Usunięcie" : "Edycja") : "Wszystkie akcje")}</SelectValue>
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start">
                        <SelectItem value="">Wszystkie akcje</SelectItem>
                        {actionOptions.map((a) => (
                            <SelectItem key={a} value={a}>
                                {a === "INSERT" ? "Dodanie" : a === "DELETE" ? "Usunięcie" : "Edycja"}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={tableFilter} onValueChange={(v) => setTableFilter(v ?? "")}>
                    <SelectTrigger size="sm" className="min-w-40">
                        <SelectValue>{(value: string) => (value ? value : "Wszystkie tabele")}</SelectValue>
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start">
                        <SelectItem value="">Wszystkie tabele</SelectItem>
                        {tableOptions.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {hasFilters && (
                    <Tooltip>
                        <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={handleClearFilters} />}>
                            <HugeiconsIcon icon={MultiplicationSignIcon} strokeWidth={2} className="size-3.5" />
                            <span className="sr-only">Wyczyść filtry</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Wyczyść filtry</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>

            <LogsTable columns={columns} data={filteredLogs} />
        </div>
    );
}
