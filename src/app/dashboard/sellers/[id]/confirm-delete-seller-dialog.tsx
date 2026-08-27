"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { deleteSeller } from "@/actions/seller";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { SellerRow } from "../sellers-utils";

interface ConfirmDeleteSellerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    seller: SellerRow | null;
    onDeleted?: () => void;
}

export function ConfirmDeleteSellerDialog({ open, onOpenChange, seller, onDeleted }: ConfirmDeleteSellerDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenChange = (open: boolean) => {
        if (!open) setError(null);
        onOpenChange(open);
    };

    const handleDelete = async () => {
        if (!seller) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await deleteSeller(seller.id);
            handleOpenChange(false);
            onDeleted?.();
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
                    <AlertDialogTitle>Usuń profil</AlertDialogTitle>
                    <AlertDialogDescription>
                        Czy na pewno chcesz usunąć sprzedawcę
                        <br />
                        <span className="font-medium text-foreground">
                            {seller?.firstName} {seller?.lastName} {seller?.classSymbol && `(${seller.classSymbol})`}
                        </span>
                        ?<br />
                        Wszystkie przypisane podręczniki również zostaną usunięte.
                        <br />
                        <span className="font-bold">Tej operacji nie można cofnąć</span>.
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
