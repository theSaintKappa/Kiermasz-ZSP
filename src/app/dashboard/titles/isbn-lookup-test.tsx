"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function IsbnLookupTest() {
    const [isbn, setIsbn] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!isbn.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`/api/isbn-search?isbn=${encodeURIComponent(isbn.trim())}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? `HTTP ${res.status}`);
            } else {
                setResult(JSON.stringify(data, null, 2));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Nie udało się połączyć z API.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex w-full flex-col gap-4">
            <div className="flex items-end gap-2">
                <div className="flex-1">
                    <Input
                        placeholder="Wpisz ISBN..."
                        value={isbn}
                        onChange={(e) => {
                            setIsbn(e.target.value);
                            if (error) setError(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearch();
                        }}
                        disabled={loading}
                    />
                </div>
                <Button onClick={handleSearch} disabled={loading || !isbn.trim()}>
                    {loading ? "Szukam..." : "Szukaj"}
                </Button>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            {result && <pre className="overflow-auto rounded-md border bg-muted/30 p-4 text-sm">{result}</pre>}
        </div>
    );
}
