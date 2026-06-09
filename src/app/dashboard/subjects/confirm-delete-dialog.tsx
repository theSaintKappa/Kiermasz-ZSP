"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { deleteSubject } from "@/actions/subject";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
        if (!open) {
            setError(null);
        }
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
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Usuń przedmiot</DialogTitle>
                    <DialogDescription>
                        Na pewno chcesz usunąć przedmiot <span className="font-medium text-foreground">{subject?.name}</span>?
                    </DialogDescription>
                </DialogHeader>
                {subject && subject.textbookCount > 0 && (
                    <div className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-3">
                        <HugeiconsIcon icon={Alert02Icon} className="mt-0.5 size-5 shrink-0 text-destructive" strokeWidth={2} />
                        <div className="space-y-1 text-sm">
                            <p className="font-semibold text-destructive">
                                Uwaga — {subject.textbookCount} {subject.textbookCount === 1 ? "podręcznik odwołuje się" : subject.textbookCount < 5 ? "podręczniki odwołują się" : "podręczników odwołuje się"} do tego przedmiotu.
                            </p>
                            <p className="text-muted-foreground">Po usunięciu przedmiotu pole „przedmiot” w {subject.textbookCount === 1 ? "tym tytule" : "tych tytułach"} zostanie wyczyszczone (ustawione jako brak).</p>
                        </div>
                    </div>
                )}
                <p className="text-muted-foreground text-sm">Tej operacji nie można cofnąć.</p>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Anuluj
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                        {isSubmitting ? "Usuwanie..." : "Usuń"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
