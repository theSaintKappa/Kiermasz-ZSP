"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { deleteSubject } from "@/actions/subject";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { SubjectRow } from "./subjects-table";

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subject: SubjectRow | null;
}

export function ConfirmDeleteDialog({ open, onOpenChange, subject }: ConfirmDeleteDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenChange = (open: boolean) => {
        if (!open) setError(null);
        onOpenChange(open);
    };

    const handleDelete = async () => {
        if (!subject) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await deleteSubject(subject.id);
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
                    <AlertDialogTitle>Usuń przedmiot</AlertDialogTitle>
                    <AlertDialogDescription>
                        <p>
                            Na pewno chcesz usunąć przedmiot <span className="font-medium text-foreground">{subject?.name}</span>?
                        </p>
                        <p>Tej operacji nie można cofnąć.</p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {subject && subject.textbookCount > 0 && (
                    <div className="flex flex-col gap-2 rounded-md border border-destructive bg-destructive/10 p-3 text-center text-sm">
                        <p className="font-semibold text-destructive">
                            {subject.textbookCount} {subject.textbookCount === 1 ? "podręcznik odwołuje się" : subject.textbookCount < 5 ? "podręczniki odwołują się" : "podręczników odwołuje się"} do tego przedmiotu.
                        </p>
                        <p className="text-muted-foreground">Po usunięciu przedmiotu pole "przedmiot" w {subject.textbookCount === 1 ? "tym tytule" : "tych tytułach"} zostanie wyczyszczone.</p>
                    </div>
                )}
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
