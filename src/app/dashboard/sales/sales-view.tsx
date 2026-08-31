"use client";

import { AlertCircleIcon, Cancel01Icon, CryingIcon, Loading03Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { useSalesSearch } from "@/hooks/use-sales-search";
import { getCurrentPhase } from "@/lib/event-utils";
import { useEventStore } from "@/stores/event-store";
import { SellerCard } from "./seller-card";

interface SalesViewProps {
    initialQuery: string;
}

export function SalesView({ initialQuery }: SalesViewProps) {
    const selectedEventId = useEventStore((s) => s.selectedEventId);
    const events = useEventStore((s) => s.events);
    const event = events.find((e) => e.id === selectedEventId);

    const [query, setQuery] = useState(initialQuery);
    const inputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();
    const pathname = usePathname();
    const isFirstRender = useRef(true);

    const { groups, isLoading, refresh } = useSalesSearch(query, selectedEventId);

    const currentPhase = event ? getCurrentPhase(event.phases) : null;
    const isSellingPhase = currentPhase?.phase === "selling";

    // Focus searchbar on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Sync query to URL (?q=...) — debounced, skip first render
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            const params = new URLSearchParams();
            if (query.trim()) params.set("q", query);
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }, 300);
        return () => clearTimeout(timer);
    }, [query, pathname, router]);

    // Realtime: refresh search when textbook_items change
    useEffect(() => {
        if (!selectedEventId) return;
        const { createClient } = require("@/lib/supabase/client");
        const supabase = createClient();

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const channel = supabase
            .channel("sales-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "textbook_items", filter: `event_id=eq.${selectedEventId}` }, () => {
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => refresh(), 500);
            })
            .subscribe();

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            supabase.removeChannel(channel);
        };
    }, [selectedEventId, refresh]);

    const hasQuery = query.trim().length > 0;
    const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

    const handleSearchbarClear = () => {
        setQuery("");
        inputRef.current?.focus();
    };

    return (
        <div className="flex w-full flex-col gap-4">
            {/* Phase warning */}
            {event && !isSellingPhase && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-sm dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0" />
                    Faza sprzedaży nie jest aktywna. Transakcje są nadal możliwe.
                </div>
            )}

            {/* Searchbar */}
            <InputGroup className="h-12">
                <InputGroupInput ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nazwisko, klasa, tytuł, przedmiot lub ISBN…" className="text-base!" autoFocus />
                <InputGroupAddon>
                    <HugeiconsIcon icon={Search01Icon} />
                </InputGroupAddon>
                {query && (
                    <InputGroupAddon align="inline-end">
                        {totalItems} {totalItems === 1 ? "wynik" : totalItems % 10 >= 2 && totalItems % 10 <= 4 && !(totalItems % 100 >= 12 && totalItems % 100 <= 14) ? "wyniki" : "wyników"}
                        <InputGroupButton size="icon-xs" onClick={handleSearchbarClear}>
                            <HugeiconsIcon icon={Cancel01Icon} />
                        </InputGroupButton>
                    </InputGroupAddon>
                )}
            </InputGroup>

            {/* Results */}
            {!hasQuery ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <HugeiconsIcon icon={Search01Icon} className="mb-3 size-8 opacity-30" />
                    <p className="text-sm">Wpisz, aby wyszukać podręczniki</p>
                </div>
            ) : isLoading && groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <HugeiconsIcon icon={Loading03Icon} className="mb-3 size-8 animate-spin opacity-30" />
                    <p className="text-sm">Wyszukiwanie podręczników…</p>
                </div>
            ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <HugeiconsIcon icon={CryingIcon} className="mb-3 size-8 opacity-30" />
                    <p className="text-sm">Brak wyników dla &ldquo;{query}&rdquo;</p>
                </div>
            ) : (
                <div className="columns-1 gap-3 xl:columns-2">
                    {groups.map((group) => (
                        <SellerCard key={group.sellerId} group={group} />
                    ))}
                </div>
            )}
        </div>
    );
}
