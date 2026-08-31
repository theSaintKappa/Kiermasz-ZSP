"use client";

import { Alert02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { fulfillReservation } from "@/actions/reservation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatPrice } from "@/lib/format-utils";
import type { ReservationRow } from "./reservations-utils";

interface FulfillReservationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reservation: ReservationRow | null;
}

export function FulfillReservationDialog({ open, onOpenChange, reservation }: FulfillReservationDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenChange = (open: boolean) => {
        if (!open) setError(null);
        onOpenChange(open);
    };

    const handleFulfill = async () => {
        if (!reservation) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await fulfillReservation(reservation.id);
            handleOpenChange(false);
            toast.success(`Rezerwacja ${reservation.reservationNumber} zrealizowana`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const count = reservation?.items.length ?? 0;
    const total = reservation?.total ?? 0;

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogMedia>
                        <HugeiconsIcon icon={Alert02Icon} />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Zrealizuj rezerwację</AlertDialogTitle>
                    <AlertDialogDescription>
                        Czy na pewno chcesz zrealizować rezerwację
                        <br />
                        <span className="font-medium font-mono text-foreground">{reservation?.reservationNumber}</span>?
                        <br />
                        <span className="font-bold">
                            {count} {count === 1 ? "podręcznik" : count < 5 ? "podręczniki" : "podręczników"} zostanie oznaczonych jako sprzedane ({formatPrice(total)}).
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel variant="outline">Wróć</AlertDialogCancel>
                    <AlertDialogAction onClick={handleFulfill} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
                                Realizowanie…
                            </>
                        ) : (
                            "Zrealizuj"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
