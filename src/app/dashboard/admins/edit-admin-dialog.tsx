"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { updateAdmin } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminRow } from "./admins-table";

const editAdminSchema = z.object({
    firstName: z.string().trim().min(1, "Podaj imię"),
    lastName: z.string().trim().min(1, "Podaj nazwisko"),
    role: z.enum(["admin", "super_admin"]),
});

type EditAdminFormValues = z.infer<typeof editAdminSchema>;

interface EditAdminDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    admin: AdminRow | null;
}

export function EditAdminDialog({ open, onOpenChange, admin }: EditAdminDialogProps) {
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<EditAdminFormValues>({
        resolver: zodResolver(editAdminSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            role: "admin",
        },
    });

    useEffect(() => {
        if (admin) {
            reset({
                firstName: admin.firstName,
                lastName: admin.lastName,
                role: admin.role,
            });
        }
    }, [admin, reset]);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setServerError(null);
        }
        onOpenChange(open);
    };

    const onSubmit = async (data: EditAdminFormValues) => {
        if (!admin) return;
        setServerError(null);

        try {
            await updateAdmin({
                id: admin.id,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
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
                    <DialogTitle>Edytuj administratora</DialogTitle>
                    <DialogDescription>Zmień dane administratora.</DialogDescription>
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
                        <Field data-invalid={Boolean(errors.role)}>
                            <FieldLabel htmlFor="edit-role">Rola</FieldLabel>
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger id="edit-role" className="w-full">
                                            <SelectValue>{(value: string) => (value === "admin" ? "Admin" : value === "super_admin" ? "Super Admin" : "")}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="super_admin">Super Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <FieldError errors={[errors.role]} />
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
