"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { createAdmin } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"admin" | "super_admin">("admin");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<Credentials | null>(null);

    const resetForm = () => {
        setStep("form");
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setRole("admin");
        setError(null);
        setCredentials(null);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) resetForm();
        onOpenChange(open);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await createAdmin({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password,
                role,
            });
            setCredentials({ email: result.email, password: result.password });
            setStep("success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
    };

    const isValid = firstName.trim() && lastName.trim() && email.trim() && password.trim();

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                {step === "form" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Dodaj administratora</DialogTitle>
                            <DialogDescription>Utwórz konto nowego administratora. Zapisz dane logowania — nie będą później widoczne.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="firstName">Imię</Label>
                                        <Input id="firstName" placeholder="Jan" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lastName">Nazwisko</Label>
                                        <Input id="lastName" placeholder="Kowalski" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="jan.kowalski@zstio.edu.pl" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="password">Hasło</Label>
                                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="role">Rola</Label>
                                    <Select value={role} onValueChange={(v) => setRole(v as "admin" | "super_admin")}>
                                        <SelectTrigger id="role" className="w-full">
                                            <SelectValue>{(value: string) => (value === "admin" ? "Admin" : value === "super_admin" ? "Super Admin" : "")}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="super_admin">Super Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {error && <p className="text-destructive text-sm">{error}</p>}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                                    Anuluj
                                </Button>
                                <Button type="submit" disabled={!isValid || isSubmitting}>
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
                                        <p className="font-medium text-sm">{credentials.email}</p>
                                    </div>
                                    <Button variant="ghost" size="icon-sm" onClick={() => copyToClipboard(credentials.email)} title="Kopiuj email">
                                        <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
                                        <span className="sr-only">Kopiuj email</span>
                                    </Button>
                                </div>
                            </div>
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Hasło</p>
                                        <p className="font-medium text-sm">{credentials.password}</p>
                                    </div>
                                    <Button variant="ghost" size="icon-sm" onClick={() => copyToClipboard(credentials.password)} title="Kopiuj hasło">
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
