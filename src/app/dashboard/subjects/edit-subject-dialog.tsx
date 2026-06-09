"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updateSubject } from "@/actions/subject";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { SubjectRow } from "./subjects-table";

const editSubjectSchema = z.object({
    name: z.string().trim().min(1, "Podaj nazwę przedmiotu"),
});

type EditSubjectFormValues = z.infer<typeof editSubjectSchema>;

interface EditSubjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subject: SubjectRow | null;
}

export function EditSubjectDialog({ open, onOpenChange, subject }: EditSubjectDialogProps) {
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<EditSubjectFormValues>({
        resolver: zodResolver(editSubjectSchema),
        defaultValues: {
            name: "",
        },
    });

    useEffect(() => {
        if (subject) {
            reset({ name: subject.name });
        }
    }, [subject, reset]);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setServerError(null);
        }
        onOpenChange(open);
    };

    const onSubmit = async (data: EditSubjectFormValues) => {
        if (!subject) return;
        setServerError(null);

        try {
            await updateSubject(subject.id, data.name);
            handleOpenChange(false);
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edytuj przedmiot</DialogTitle>
                    <DialogDescription>Zmień nazwę przedmiotu.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <FieldGroup className="py-4">
                        <Field data-invalid={Boolean(errors.name)}>
                            <FieldLabel htmlFor="edit-subject-name">Nazwa</FieldLabel>
                            <Input id="edit-subject-name" autoFocus {...register("name")} />
                            <FieldError errors={[errors.name]} />
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
