"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { createAdmin } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const createAdminSchema = z.object({
    firstName: z.string().trim().min(1, "Podaj imię"),
    lastName: z.string().trim().min(1, "Podaj nazwisko"),
    email: z.string().trim().min(1, "Podaj adres email").pipe(z.email("Podaj poprawny adres email")),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    role: z.enum(["admin", "super_admin"]),
});

type CreateAdminFormValues = z.infer<typeof createAdminSchema>;

interface CreateAdminDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Step = "form" | "success";

interface Credentials {
    email: string;
    password: string;
}

export function CreateAdminDialog({ open, onOpenChange }: CreateAdminDialogProps) {
    const [step, setStep] = useState<Step>("form");
    const [serverError, setServerError] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<Credentials | null>(null);
    const emailRef = useRef<HTMLParagraphElement>(null);
    const passwordRef = useRef<HTMLParagraphElement>(null);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CreateAdminFormValues>({
        resolver: zodResolver(createAdminSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            role: "admin",
        },
    });

    const resetForm = () => {
        setStep("form");
        setServerError(null);
        setCredentials(null);
        reset();
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) resetForm();
        onOpenChange(open);
    };

    const onSubmit = async (data: CreateAdminFormValues) => {
        setServerError(null);

        try {
            const result = await createAdmin({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                role: data.role,
            });
            setCredentials({ email: result.email, password: result.password });
            setStep("success");
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
        }
    };

    const copyToClipboard = async (text: string, element: HTMLParagraphElement | null) => {
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(text);
                return;
            } catch {
                // Fall through to select fallback
            }
        }

        const selection = window.getSelection();
        const range = document.createRange();
        if (element) range.selectNodeContents(element);
        selection?.removeAllRanges();
        selection?.addRange(range);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                {step === "form" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Dodaj administratora</DialogTitle>
                            <DialogDescription>Utwórz konto nowego administratora. Zapisz dane logowania — nie będą później widoczne.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} noValidate>
                            <FieldGroup className="py-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <Field data-invalid={Boolean(errors.firstName)}>
                                        <FieldLabel htmlFor="firstName">Imię</FieldLabel>
                                        <Input id="firstName" placeholder="Jan" autoFocus {...register("firstName")} />
                                        <FieldError errors={[errors.firstName]} />
                                    </Field>
                                    <Field data-invalid={Boolean(errors.lastName)}>
                                        <FieldLabel htmlFor="lastName">Nazwisko</FieldLabel>
                                        <Input id="lastName" placeholder="Kowalski" {...register("lastName")} />
                                        <FieldError errors={[errors.lastName]} />
                                    </Field>
                                </div>
                                <Field data-invalid={Boolean(errors.email)}>
                                    <FieldLabel htmlFor="email">Email</FieldLabel>
                                    <Input id="email" type="email" placeholder="kowalski@example.com" {...register("email")} />
                                    <FieldError errors={[errors.email]} />
                                </Field>
                                <Field data-invalid={Boolean(errors.password)}>
                                    <FieldLabel htmlFor="password">Hasło</FieldLabel>
                                    <Input id="password" type="password" placeholder="••••••••••" {...register("password")} />
                                    <FieldError errors={[errors.password]} />
                                </Field>
                                <Field data-invalid={Boolean(errors.role)}>
                                    <FieldLabel htmlFor="role">Rola</FieldLabel>
                                    <Controller
                                        name="role"
                                        control={control}
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger id="role" className="w-full">
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
                                    {isSubmitting ? "Tworzenie..." : "Dodaj"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
                {step === "success" && credentials && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Administrator utworzony</DialogTitle>
                            <DialogDescription>Skopiuj dane logowania. Nie będą one ponownie wyświetlone.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-4">
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Email</p>
                                        <p className="font-medium text-sm" ref={emailRef}>
                                            {credentials.email}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon-sm" onClick={() => copyToClipboard(credentials.email, emailRef.current)} title="Kopiuj email">
                                        <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
                                        <span className="sr-only">Kopiuj email</span>
                                    </Button>
                                </div>
                            </div>
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Hasło</p>
                                        <p className="font-medium text-sm" ref={passwordRef}>
                                            {credentials.password}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon-sm" onClick={() => copyToClipboard(credentials.password, passwordRef.current)} title="Kopiuj hasło">
                                        <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
                                        <span className="sr-only">Kopiuj hasło</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => handleOpenChange(false)}>Zamknij</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
