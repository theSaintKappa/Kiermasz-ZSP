"use client";

import { AlmsIcon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { confirmPayout } from "@/actions/payout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatPrice } from "@/lib/format-utils";
import type { PayoutSellerRow } from "./payouts-utils";
import { textbookCountLabel } from "./payouts-utils";

interface ConfirmPayoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    seller: PayoutSellerRow | null;
}

export function ConfirmPayoutDialog({ open, onOpenChange, seller }: ConfirmPayoutDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenChange = (open: boolean) => {
        if (!open) setError(null);
        onOpenChange(open);
    };

    const handleConfirm = async () => {
        if (!seller) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await confirmPayout(seller.sellerId);
            handleOpenChange(false);
            toast.success("Wypłata potwierdzona.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const name = seller ? `${seller.firstName} ${seller.lastName}` : "";
    const cls = seller?.classSymbol ?? "";
    const amount = seller?.owedTotal ?? 0;
    const toReturn = seller?.toReturnCount ?? 0;

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogMedia>
                        <HugeiconsIcon icon={AlmsIcon} />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Potwierdź wypłatę</AlertDialogTitle>
                    <AlertDialogDescription>
                        Czy na pewno wypłacić{" "}
                        <span className="font-medium text-foreground">
                            {name} {cls && `(${cls})`}
                        </span>{" "}
                        kwotę <span className="font-bold">{formatPrice(amount)}</span>
                        {toReturn > 0 && (
                            <>
                                {" "}
                                i zwrócić <span className="font-bold">{toReturn}</span> {textbookCountLabel(toReturn)}
                            </>
                        )}
                        ? Po potwierdzeniu sprzedawca zostanie oznaczony jako wypłacony.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel variant="outline">Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
                                Wypłacanie...
                            </>
                        ) : (
                            "Wypłać"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
