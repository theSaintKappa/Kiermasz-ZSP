"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { saveTerms } from "@/actions/terms";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format-utils";

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface TermsEditorProps {
    eventId: string | null;
    initialContent: string;
    initialUpdatedAt: string | null;
}

export function TermsEditor({ eventId, initialContent, initialUpdatedAt }: TermsEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [status, setStatus] = useState<SaveStatus>("idle");
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialUpdatedAt);

    const contentRef = useRef(content);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savingRef = useRef(false);
    const pendingRef = useRef(false);

    const performSave = useCallback(
        async (value: string) => {
            if (!eventId || savingRef.current) {
                pendingRef.current = true;
                return;
            }
            savingRef.current = true;
            setStatus("saving");
            try {
                const res = await saveTerms(eventId, value);
                setLastSavedAt(res.updatedAt);
                setStatus("saved");
            } catch (err) {
                setStatus("error");
                toast.error(err instanceof Error ? err.message : "Błąd zapisu");
            } finally {
                savingRef.current = false;
                if (pendingRef.current) {
                    pendingRef.current = false;
                    performSave(contentRef.current);
                }
            }
        },
        [eventId],
    );

    const scheduleSave = useCallback(
        (value: string) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => performSave(value), 1000);
        },
        [performSave],
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setContent(value);
        contentRef.current = value;
        setStatus("dirty");
        scheduleSave(value);
    };

    const handleBlur = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (status === "dirty") {
            performSave(contentRef.current);
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const statusText = (() => {
        switch (status) {
            case "dirty":
                return "Niezapisane zmiany";
            case "saving":
                return "Zapisywanie...";
            case "saved":
            case "idle":
                return lastSavedAt ? `Zapisano ${formatDateTime(lastSavedAt)}` : null;
            case "error":
                return "Błąd zapisu";
        }
    })();

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-lg">Regulamin</h2>
                {statusText && <span className={`text-xs ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>{statusText}</span>}
            </div>
            <div className="grid min-h-125 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                <Textarea
                    value={content}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={!eventId}
                    placeholder="Wpisz treść regulaminu w formacie Markdown..."
                    aria-label="Treść regulaminu"
                    className="field-sizing-fixed h-full w-full resize-none font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] text-sm"
                />
                <div className="h-full overflow-y-auto rounded-lg border bg-card p-2">
                    {content.trim() ? (
                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">Podgląd jest pusty.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
