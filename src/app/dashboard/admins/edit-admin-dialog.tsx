"use client";

import { useEffect, useState } from "react";
import { updateAdmin } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminRow } from "./admins-table";

interface EditAdminDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    admin: AdminRow | null;
}

export function EditAdminDialog({ open, onOpenChange, admin }: EditAdminDialogProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState<"admin" | "super_admin">("admin");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (admin) {
            setFirstName(admin.firstName);
            setLastName(admin.lastName);
            setRole(admin.role);
        }
    }, [admin]);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setError(null);
        }
        onOpenChange(open);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!admin || !firstName.trim() || !lastName.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await updateAdmin({
                id: admin.id,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                role,
            });
            handleOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = firstName.trim() && lastName.trim();

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edytuj administratora</DialogTitle>
                    <DialogDescription>Zmień dane administratora.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-firstName">Imię</Label>
                                <Input id="edit-firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-lastName">Nazwisko</Label>
                                <Input id="edit-lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-role">Rola</Label>
                            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "super_admin")}>
                                <SelectTrigger id="edit-role" className="w-full">
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
                            {isSubmitting ? "Zapisywanie..." : "Zapisz"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
