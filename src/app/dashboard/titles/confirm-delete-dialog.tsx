"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { deleteTitle } from "@/actions/title";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { TextbookRow } from "./create-title-dialog";

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    textbook: TextbookRow | null;
    onDeleted?: () => void;
}

export function ConfirmDeleteDialog({ open, onOpenChange, textbook, onDeleted }: ConfirmDeleteDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenChange = (open: boolean) => {
        if (!open) setError(null);
        onOpenChange(open);
    };

    const handleDelete = async () => {
        if (!textbook) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await deleteTitle(textbook.id);
            onDeleted?.();
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
                    <AlertDialogTitle>Usuń tytuł</AlertDialogTitle>
                    <AlertDialogDescription>
                        Na pewno chcesz usunąć podręcznik{" "}
                        <span className="font-medium text-foreground">{textbook?.title}</span>
                        {textbook?.isbn && (
                            <>
                                {" "}
                                (<span className="font-medium text-foreground">{textbook.isbn}</span>)
                            </>
                        )}
                        ? Tej operacji nie można cofnąć.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel variant="outline">Anuluj</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                        {isSubmitting ? "Usuwanie..." : "Usuń"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
