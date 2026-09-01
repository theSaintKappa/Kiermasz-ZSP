"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { updateTextbookItem } from "@/actions/seller";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import type { TextbookItemRow } from "../sellers-utils";

const editItemSchema = z.object({
    price: z.number().int("Cena musi być liczbą całkowitą").positive("Cena musi być większa od zera"),
    notes: z.string().optional(),
});

type EditItemFormValues = z.infer<typeof editItemSchema>;

interface EditTextbookItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: TextbookItemRow | null;
}

export function EditTextbookItemDialog({ open, onOpenChange, item }: EditTextbookItemDialogProps) {
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<EditItemFormValues>({
        resolver: zodResolver(editItemSchema),
        defaultValues: { price: undefined, notes: "" },
    });

    useEffect(() => {
        if (item) {
            reset({
                price: item.price,
                notes: item.notes ?? "",
            });
        }
    }, [item, reset]);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setServerError(null);
            reset();
        }
        onOpenChange(open);
    };

    const onSubmit = async (data: EditItemFormValues) => {
        if (!item) return;
        setServerError(null);
        try {
            await updateTextbookItem({
                id: item.id,
                price: data.price,
                notes: data.notes?.trim() || null,
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
                    <DialogTitle>Edytuj podręcznik</DialogTitle>
                    <DialogDescription>
                        {item?.title}
                        {item?.subtitle ? ` — ${item.subtitle}` : ""} <span className="font-mono text-xs">[{item?.isbn}]</span>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <FieldGroup className="py-4">
                        <Field data-invalid={Boolean(errors.price)}>
                            <FieldLabel htmlFor="edit-price">Cena</FieldLabel>
                            <Controller
                                name="price"
                                control={control}
                                render={({ field: { value, onChange, ...field } }) => (
                                    <InputGroup>
                                        <InputGroupInput
                                            {...field}
                                            id="edit-price"
                                            type="number"
                                            step="1"
                                            min="0"
                                            autoFocus
                                            value={value ?? ""}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                onChange(v === "" ? "" : Number(v));
                                            }}
                                        />
                                        <InputGroupAddon align="inline-end">
                                            <InputGroupText>PLN</InputGroupText>
                                        </InputGroupAddon>
                                    </InputGroup>
                                )}
                            />
                            <FieldError errors={[errors.price]} />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="edit-notes">Notatki</FieldLabel>
                            <Textarea id="edit-notes" placeholder="Opcjonalne notatki..." {...register("notes")} />
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
