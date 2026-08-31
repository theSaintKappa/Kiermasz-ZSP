"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { addDays, format } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createReservation } from "@/actions/sale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCartStore } from "@/stores/cart-store";

const reserveSchema = z.object({
    firstName: z.string().min(1, "Podaj imię"),
    lastName: z.string().min(1, "Podaj nazwisko"),
    expiresOn: z.date({ error: "Wybierz datę" }),
});

type ReserveFormValues = z.infer<typeof reserveSchema>;

interface ReserveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (reservationNumber: string, expiresOn: string) => void;
}

export function ReserveDialog({ open, onOpenChange, onSuccess }: ReserveDialogProps) {
    const items = useCartStore((s) => s.items);
    const [calendarOpen, setCalendarOpen] = useState(false);

    const tomorrow = addDays(new Date(), 1);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ReserveFormValues>({
        resolver: zodResolver(reserveSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            expiresOn: tomorrow,
        },
    });

    const expiresOn = watch("expiresOn");

    const onSubmit = async (data: ReserveFormValues) => {
        try {
            const expiresOnStr = format(data.expiresOn, "yyyy-MM-dd");
            const result = await createReservation(
                items.map((i) => i.itemId),
                data.firstName,
                data.lastName,
                expiresOnStr,
            );

            if (result.conflicts && result.conflicts.length > 0) {
                toast.error(`${result.conflicts.length} podręczników jest niedostępnych`);
                return;
            }

            if (result.reservationNumber) {
                reset({ firstName: "", lastName: "", expiresOn: addDays(new Date(), 1) });
                onSuccess(result.reservationNumber, format(data.expiresOn, "d.MM.yyyy", { locale: pl }));
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Błąd tworzenia rezerwacji");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Utwórz rezerwację</DialogTitle>
                    <DialogDescription>
                        {items.length} {items.length === 1 ? "podręcznik" : "podręczniki"} w koszyku
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <FieldGroup>
                        <Field data-invalid={!!errors.firstName}>
                            <FieldLabel>Imię kupującego</FieldLabel>
                            <Input {...register("firstName")} placeholder="Jan" autoFocus />
                            <FieldError errors={[errors.firstName]} />
                        </Field>

                        <Field data-invalid={!!errors.lastName}>
                            <FieldLabel>Nazwisko kupującego</FieldLabel>
                            <Input {...register("lastName")} placeholder="Kowalski" />
                            <FieldError errors={[errors.lastName]} />
                        </Field>

                        <Field data-invalid={!!errors.expiresOn}>
                            <FieldLabel>Ważna do (koniec dnia)</FieldLabel>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                <PopoverTrigger
                                    render={
                                        <button type="button" className="flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30">
                                            {expiresOn ? format(expiresOn, "d MMMM yyyy", { locale: pl }) : "Wybierz datę"}
                                        </button>
                                    }
                                />
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={expiresOn}
                                        onSelect={(date) => {
                                            if (date) {
                                                setValue("expiresOn", date, { shouldValidate: true });
                                                setCalendarOpen(false);
                                            }
                                        }}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        locale={pl}
                                    />
                                </PopoverContent>
                            </Popover>
                            <FieldError errors={[errors.expiresOn]} />
                        </Field>
                    </FieldGroup>

                    <DialogFooter className="mt-4">
                        <DialogClose render={<Button variant="outline" />}>Anuluj</DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
                                    Tworzenie…
                                </>
                            ) : (
                                "Utwórz rezerwację"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
