"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updateSeller } from "@/actions/seller";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { SellerRow } from "../sellers-utils";

const editSellerSchema = z.object({
    firstName: z.string().trim().min(1, "Podaj imię"),
    lastName: z.string().trim().min(1, "Podaj nazwisko"),
    classSymbol: z.string().trim().min(1, "Podaj symbol klasy"),
});

type EditSellerFormValues = z.infer<typeof editSellerSchema>;

interface EditSellerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    seller: SellerRow | null;
}

export function EditSellerDialog({ open, onOpenChange, seller }: EditSellerDialogProps) {
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<EditSellerFormValues>({
        resolver: zodResolver(editSellerSchema),
        defaultValues: { firstName: "", lastName: "", classSymbol: "" },
    });

    useEffect(() => {
        if (seller) {
            reset({
                firstName: seller.firstName,
                lastName: seller.lastName,
                classSymbol: seller.classSymbol,
            });
        }
    }, [seller, reset]);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setServerError(null);
            reset();
        }
        onOpenChange(open);
    };

    const onSubmit = async (data: EditSellerFormValues) => {
        if (!seller) return;
        setServerError(null);
        try {
            await updateSeller({
                id: seller.id,
                firstName: data.firstName,
                lastName: data.lastName,
                classSymbol: data.classSymbol,
            });
            handleOpenChange(false);
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edytuj profil</DialogTitle>
                    <DialogDescription>Zmień dane sprzedawcy.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <FieldGroup className="py-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Field data-invalid={Boolean(errors.firstName)}>
                                <FieldLabel htmlFor="edit-firstName">Imię</FieldLabel>
                                <Input id="edit-firstName" autoFocus {...register("firstName")} />
                                <FieldError errors={[errors.firstName]} />
                            </Field>
                            <Field data-invalid={Boolean(errors.lastName)}>
                                <FieldLabel htmlFor="edit-lastName">Nazwisko</FieldLabel>
                                <Input id="edit-lastName" {...register("lastName")} />
                                <FieldError errors={[errors.lastName]} />
                            </Field>
                        </div>
                        <Field data-invalid={Boolean(errors.classSymbol)}>
                            <FieldLabel htmlFor="edit-classSymbol">Klasa</FieldLabel>
                            <Input id="edit-classSymbol" {...register("classSymbol")} />
                            <FieldError errors={[errors.classSymbol]} />
                        </Field>
                        <FieldError>{serverError}</FieldError>
                    </FieldGroup>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                            Anuluj
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Zapisywanie..." : "Zapisz"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
