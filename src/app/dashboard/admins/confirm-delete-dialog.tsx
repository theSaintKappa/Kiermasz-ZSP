"use client";

import { useState } from "react";
import { deleteAdmin } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminRow } from "./admins-table";

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    admin: AdminRow | null;
}

export function ConfirmDeleteDialog({ open, onOpenChange, admin }: ConfirmDeleteDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setError(null);
        }
        onOpenChange(open);
    };

    const handleDelete = async () => {
        if (!admin) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await deleteAdmin(admin.id);
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
                    <DialogTitle>Usuń administratora</DialogTitle>
                    <DialogDescription>
                        Na pewno chcesz usunąć administratora{" "}
                        <span className="font-medium text-foreground">
                            {admin?.firstName} {admin?.lastName}
                        </span>
                        ? Tej operacji nie można cofnąć.
                    </DialogDescription>
                </DialogHeader>
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
