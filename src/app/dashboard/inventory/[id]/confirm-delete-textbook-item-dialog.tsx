"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { deleteTextbookItem } from "@/actions/seller";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { TextbookItemRow } from "../inventory-utils";

interface ConfirmDeleteTextbookItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: TextbookItemRow | null;
}

export function ConfirmDeleteTextbookItemDialog({ open, onOpenChange, item }: ConfirmDeleteTextbookItemDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenChange = (open: boolean) => {
        if (!open) setError(null);
        onOpenChange(open);
    };

    const handleDelete = async () => {
        if (!item) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await deleteTextbookItem(item.id);
            handleOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogMedia>
                        <HugeiconsIcon icon={Alert02Icon} />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Usuń podręcznik</AlertDialogTitle>
                    <AlertDialogDescription>
                        Czy na pewno chcesz usunąć
                        <br />
                        <span className="font-medium text-foreground">
                            {item?.title}
                            {item?.subtitle ? ` — ${item.subtitle}` : ""}
                        </span>
                        ?<br />
                        <span className="font-bold">Tej operacji nie można cofnąć.</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {item && item.status === "sold" && (
                    <div className="flex flex-col gap-2 rounded-md border border-destructive bg-destructive/10 p-3 text-center text-sm">
                        <p className="font-semibold text-destructive">Ten podręcznik został sprzedany.</p>
                        <p className="text-muted-foreground">Nie można go usunąć. Jeśli to błąd, skontaktuj się z administratorem.</p>
                    </div>
                )}
                {item && item.status === "reserved" && (
                    <div className="flex flex-col gap-2 rounded-md border border-destructive bg-destructive/10 p-3 text-center text-sm">
                        <p className="font-semibold text-destructive">Ten podręcznik jest zarezerwowany.</p>
                        <p className="text-muted-foreground">Anuluj rezerwację, zanim usuniesz podręcznik.</p>
                    </div>
                )}
                {error && <p className="text-destructive text-sm">{error}</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel variant="outline">Anuluj</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isSubmitting || item?.status !== "available"}>
                        {isSubmitting ? "Usuwanie..." : "Usuń"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
