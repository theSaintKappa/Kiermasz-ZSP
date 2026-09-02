"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createSeller } from "@/actions/seller";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const createSellerSchema = z.object({
    firstName: z.string().trim().min(1, "Podaj imię"),
    lastName: z.string().trim().min(1, "Podaj nazwisko"),
    // TODO: implement autocomplete for class symbols (e.g. 1A-5F)
    classSymbol: z.string().trim().min(1, "Podaj symbol klasy"),
});

type CreateSellerFormValues = z.infer<typeof createSellerSchema>;

interface CreateSellerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: (id: string) => void;
}

export function CreateSellerDialog({ open, onOpenChange, onCreated }: CreateSellerDialogProps) {
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CreateSellerFormValues>({
        resolver: zodResolver(createSellerSchema),
        defaultValues: { firstName: "", lastName: "", classSymbol: "" },
    });

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setServerError(null);
            reset();
        }
        onOpenChange(open);
    };

    const onSubmit = async (data: CreateSellerFormValues) => {
        setServerError(null);
        try {
            const result = await createSeller({
                firstName: data.firstName,
                lastName: data.lastName,
                classSymbol: data.classSymbol,
            });
            handleOpenChange(false);
            onCreated?.(result.id);
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Dodaj sprzedawcę</DialogTitle>
                    <DialogDescription>Wprowadź dane nowego sprzedawcy.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <FieldGroup className="py-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Field data-invalid={Boolean(errors.firstName)}>
                                <FieldLabel htmlFor="firstName">Imię</FieldLabel>
                                <Input id="firstName" autoFocus {...register("firstName")} />
                                <FieldError errors={[errors.firstName]} />
                            </Field>
                            <Field data-invalid={Boolean(errors.lastName)}>
                                <FieldLabel htmlFor="lastName">Nazwisko</FieldLabel>
                                <Input id="lastName" {...register("lastName")} />
                                <FieldError errors={[errors.lastName]} />
                            </Field>
                        </div>
                        <Field data-invalid={Boolean(errors.classSymbol)}>
                            <FieldLabel htmlFor="classSymbol">Klasa</FieldLabel>
                            <Input id="classSymbol" placeholder="np. 3pT" {...register("classSymbol")} />
                            <FieldError errors={[errors.classSymbol]} />
                        </Field>
                        <FieldError>{serverError}</FieldError>
                    </FieldGroup>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                            Anuluj
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Dodawanie..." : "Dodaj"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
