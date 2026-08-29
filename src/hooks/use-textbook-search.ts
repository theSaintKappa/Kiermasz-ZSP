"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TextbookTitleOption } from "@/app/dashboard/sellers/sellers-utils";

const ISBN_PATTERN = /^\d{10,13}$/;
const DEBOUNCE_MS = 300;

export function useTextbookSearch(query: string) {
    const [results, setResults] = useState<TextbookTitleOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const popularCacheRef = useRef<TextbookTitleOption[] | null>(null);

    const fetchResults = useCallback(async (q: string) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            const res = await fetch(`/api/textbook-search?${params}`, { signal: controller.signal });
            if (!res.ok) return;
            const data: TextbookTitleOption[] = await res.json();
            if (controller.signal.aborted) return;

            if (!q) popularCacheRef.current = data;
            setResults(data);
        } catch {
            // aborted or network error — ignore
        } finally {
            if (!controller.signal.aborted) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        // If we have cached popular results and query is empty, use them
        if (!query && popularCacheRef.current) {
            setResults(popularCacheRef.current);
            setIsLoading(false);
            return;
        }

        // ISBN (barcode scanner) — no debounce, instant fetch
        if (ISBN_PATTERN.test(query)) {
            fetchResults(query);
            return;
        }

        // Normal text — debounce
        timerRef.current = setTimeout(() => {
            fetchResults(query);
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [query, fetchResults]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            abortRef.current?.abort();
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return { results, isLoading };
}
