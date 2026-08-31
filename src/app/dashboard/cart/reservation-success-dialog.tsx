"use client";

import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ReservationSuccessDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reservationNumber: string;
    expiresOn: string;
}

export function ReservationSuccessDialog({ open, onOpenChange, reservationNumber, expiresOn }: ReservationSuccessDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="text-center">
                <DialogHeader className="items-center">
                    <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-6 text-primary" />
                    </div>
                    <DialogTitle>Rezerwacja utworzona</DialogTitle>
                    <DialogDescription>Zapisz ten numer i przekaż kupującemu.</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-1 py-4">
                    <span className="font-bold font-mono text-4xl tracking-wider">{reservationNumber}</span>
                    <span className="text-muted-foreground text-sm">Ważna do {expiresOn}</span>
                </div>

                <DialogFooter>
                    <Button className="w-full" onClick={() => onOpenChange(false)}>
                        OK
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
