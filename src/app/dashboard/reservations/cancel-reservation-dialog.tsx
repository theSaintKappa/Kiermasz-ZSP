"use client";

import { Alert02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { cancelReservation } from "@/actions/reservation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { ReservationRow } from "./reservations-utils";

interface CancelReservationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reservation: ReservationRow | null;
}

export function CancelReservationDialog({ open, onOpenChange, reservation }: CancelReservationDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenChange = (open: boolean) => {
        if (!open) setError(null);
        onOpenChange(open);
    };

    const handleCancel = async () => {
        if (!reservation) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await cancelReservation(reservation.id);
            handleOpenChange(false);
            toast.success(`Rezerwacja ${reservation.reservationNumber} anulowana`);
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
                    <AlertDialogTitle>Anuluj rezerwację</AlertDialogTitle>
                    <AlertDialogDescription>
                        Czy na pewno chcesz anulować rezerwację
                        <br />
                        <span className="font-medium font-mono text-foreground">{reservation?.reservationNumber}</span>?
                        <br />
                        <span className="font-bold">Podręczniki wrócą do puli dostępnych.</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel variant="outline">Wróć</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleCancel} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
                                Anulowanie…
                            </>
                        ) : (
                            "Anuluj rezerwację"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
