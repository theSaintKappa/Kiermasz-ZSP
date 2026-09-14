"use client";

import { Alert02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { undoPayout } from "@/actions/payout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDateTime, formatPrice } from "@/lib/format-utils";
import type { PayoutSellerRow } from "./payouts-utils";

interface ConfirmUndoPayoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    seller: PayoutSellerRow | null;
}

export function ConfirmUndoPayoutDialog({ open, onOpenChange, seller }: ConfirmUndoPayoutDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenChange = (open: boolean) => {
        if (!open) setError(null);
        onOpenChange(open);
    };

    const handleUndo = async () => {
        if (!seller?.payout) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await undoPayout(seller.payout.id);
            handleOpenChange(false);
            toast.success("Wypłata cofnięta.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const name = seller ? `${seller.firstName} ${seller.lastName}` : "";
    const cls = seller?.classSymbol ?? "";
    const payout = seller?.payout;

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogMedia>
                        <HugeiconsIcon icon={Alert02Icon} />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Cofnij wypłatę</AlertDialogTitle>
                    <AlertDialogDescription>
                        Czy na pewno cofnąć wypłatę dla{" "}
                        <span className="font-medium text-foreground">
                            {name} {cls && `(${cls})`}
                        </span>
                        ?{" "}
                        {payout && (
                            <>
                                Kwota: <span className="font-bold">{formatPrice(payout.amount)}</span>, wypłacono {formatDateTime(payout.paidAt)}.{payout.returnedCount > 0 && <> Zwrócone podręczniki: {payout.returnedCount}.</>}
                            </>
                        )}{" "}
                        Sprzedawca wróci na listę oczekujących.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel variant="outline">Anuluj</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleUndo} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
                                Cofanie...
                            </>
                        ) : (
                            "Cofnij"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
