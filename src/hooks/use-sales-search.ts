"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SellerGroup } from "@/app/dashboard/sales/sales-utils";
import { createClient } from "@/lib/supabase/client";

const ISBN_PATTERN = /^\d{9,13}[X\d]?$/i;
const DEBOUNCE_MS = 250;

function cleanQuery(q: string): string {
    return q.replace(/[\s]+/g, " ").trim();
}

export function useSalesSearch(query: string, eventId: string | null) {
    const [groups, setGroups] = useState<SellerGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastQueryRef = useRef<string>("");

    const fetchResults = useCallback(
        async (q: string) => {
            if (!eventId) return;

            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            lastQueryRef.current = q;

            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data, error } = await supabase.rpc("search_sales_items", {
                    p_event_id: eventId,
                    p_query: q,
                    p_limit: 15,
                });

                if (controller.signal.aborted) return;
                if (error) {
                    console.error("Sales search error:", error.message);
                    return;
                }

                setGroups((data as SellerGroup[]) ?? []);
            } catch {
                // aborted or network error
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        },
        [eventId],
    );

    const refresh = useCallback(() => {
        if (lastQueryRef.current) fetchResults(lastQueryRef.current);
    }, [fetchResults]);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        const cleaned = cleanQuery(query);
        if (!cleaned || !eventId) {
            setGroups([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        // ISBN fast-path (barcode scanner / USB wedge)
        const digitsOnly = cleaned.replace(/[\s-]/g, "");
        if (ISBN_PATTERN.test(digitsOnly)) {
            fetchResults(digitsOnly);
            return;
        }

        timerRef.current = setTimeout(() => {
            fetchResults(cleaned);
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [query, eventId, fetchResults]);

    useEffect(() => {
        return () => {
            abortRef.current?.abort();
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return { groups, isLoading, refresh };
}
