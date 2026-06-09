"use client";

import { FilterIcon, MultiplicationSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { columns } from "./columns";
import { LogsTable } from "./logs-table";
import type { LogRow } from "./logs-utils";

interface LogsViewProps {
    logs: LogRow[];
    totalCount: number;
    eventId: string | null;
    profileOptions: { id: string; name: string }[];
    actionOptions: string[];
    tableOptions: string[];
    error?: string;
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

export function LogsView({ logs: serverLogs, totalCount, eventId, profileOptions, actionOptions, tableOptions, error }: LogsViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const pageIndex = parseInt(searchParams.get("page") ?? "0", 10) || 0;
    const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10) || 50;
    const adminId = searchParams.get("adminId") ?? "";
    const action = searchParams.get("action") ?? "";
    const tableName = searchParams.get("tableName") ?? "";
    const sortId = searchParams.get("sort") ?? "createdAt";
    const sortOrder = searchParams.get("order") ?? "desc";

    const [liveLogs, setLiveLogs] = useState(serverLogs);
    const [newItemCount, setNewItemCount] = useState(0);

    const pageIndexRef = useRef(pageIndex);
    pageIndexRef.current = pageIndex;
    const filtersRef = useRef({ adminId, action, tableName });
    filtersRef.current = { adminId, action, tableName };

    useEffect(() => {
        setLiveLogs(serverLogs);
    }, [serverLogs]);

    const filteredData = (() => {
        let data = liveLogs;
        if (adminId || action || tableName) {
            data = data.filter((log) => {
                if (adminId && log.adminId !== adminId) return false;
                if (action && log.action !== action) return false;
                if (tableName && log.tableName !== tableName) return false;
                return true;
            });
        }
        return data;
    })();

    const updateUrl = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === "") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        }
        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        updateUrl({ [key]: value || null, page: "0" });
    };

    const handleClearFilters = () => {
        startTransition(() => {
            router.push("?");
        });
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: we only want to reset the new item count when the page index changes, not when other filters change
    useEffect(() => {
        setNewItemCount(0);
    }, [pageIndex]);

    const handlePaginationChange = (next: PaginationState) => {
        updateUrl({ page: String(next.pageIndex), pageSize: String(next.pageSize) });
    };

    const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
        const current = [{ id: sortId, desc: sortOrder === "desc" }] as SortingState;
        const next = typeof updater === "function" ? updater(current) : updater;
        if (next.length === 0) {
            updateUrl({ sort: null, order: null, page: "0" });
        } else {
            updateUrl({ sort: next[0].id, order: next[0].desc ? "desc" : "asc", page: "0" });
        }
    };

    const sorting: SortingState = [{ id: sortId, desc: sortOrder === "desc" }];

    const pagination: PaginationState = { pageIndex, pageSize };

    const hasFilters = adminId !== "" || action !== "" || tableName !== "";

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
                    if (raw.event_id !== null && raw.event_id !== eventId) return;

                    const { adminId: adminFilter, action: actionFilter, tableName: tableFilter } = filtersRef.current;
                    if (adminFilter && raw.admin_id !== adminFilter) return;
                    if (actionFilter && raw.action !== actionFilter) return;
                    if (tableFilter && raw.table_name !== tableFilter) return;

                    const profile = profileOptions.find((p) => p.id === raw.admin_id);
                    const adminName = profile?.name ?? null;

                    const newLog: LogRow = {
                        id: raw.id,
                        adminId: raw.admin_id,
                        adminName,
                        action: raw.action,
                        tableName: raw.table_name,
                        recordId: raw.record_id,
                        oldValues: raw.old_values,
                        newValues: raw.new_values,
                        createdAt: raw.created_at,
                        eventId: raw.event_id,
                    };

                    if (pageIndexRef.current === 0) {
                        setLiveLogs((prev) => {
                            if (prev.some((r) => r.id === newLog.id)) return prev;
                            return [newLog, ...prev];
                        });
                    } else {
                        setNewItemCount((prev) => prev + 1);
                    }
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, profileOptions]);

    return (
        <div className="flex w-full flex-col gap-4">
            {error && <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive text-sm">Wystąpił błąd podczas ładowania dziennika: {error}</div>}

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <HugeiconsIcon icon={FilterIcon} strokeWidth={2} className="size-4" />
                    <span className="font-medium text-xs">Filtry</span>
                </div>

                <Select value={adminId} onValueChange={(v) => handleFilterChange("adminId", v ?? "")}>
                    <SelectTrigger size="sm" className="min-w-40">
                        <SelectValue>{(value: string) => (value ? (profileOptions.find((p) => p.id === value)?.name ?? value) : "Wszyscy użytkownicy")}</SelectValue>
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start">
                        <SelectItem value="">Wszyscy użytkownicy</SelectItem>
                        {profileOptions.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={action} onValueChange={(v) => handleFilterChange("action", v ?? "")}>
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

                <Select value={tableName} onValueChange={(v) => handleFilterChange("tableName", v ?? "")}>
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

            {newItemCount > 0 && (
                <div className="flex items-center justify-between rounded-md bg-primary/10 px-4 py-2">
                    <span className="text-sm">{newItemCount === 1 ? "1 nowy wpis" : newItemCount <= 4 ? `${newItemCount} nowe wpisy` : `${newItemCount} nowych wpisów`}</span>
                    <Button variant="outline" size="sm" onClick={() => updateUrl({ page: "0" })}>
                        Zobacz
                    </Button>
                </div>
            )}

            <LogsTable columns={columns} data={filteredData} pagination={pagination} onPaginationChange={handlePaginationChange} sorting={sorting} onSortingChange={handleSortingChange} rowCount={totalCount} isLoading={isPending} />
        </div>
    );
}
