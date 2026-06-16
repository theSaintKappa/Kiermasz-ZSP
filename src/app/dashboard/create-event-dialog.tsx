"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useEventStore } from "@/stores/event-store";

interface CreateEventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateEventDialog({ open, onOpenChange }: CreateEventDialogProps) {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { refreshEvents, selectEvent } = useEventStore();

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setName("");
            setError(null);
            setIsSubmitting(false);
        }
        onOpenChange(open);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        setError(null);

        const supabase = createClient();
        const { data: eventId, error: rpcError } = await supabase.rpc("create_event", { p_name: name.trim() });

        if (rpcError) {
            setError(rpcError.message);
            setIsSubmitting(false);
            return;
        }

        await refreshEvents();
        if (eventId) selectEvent(eventId);
        setName("");
        setIsSubmitting(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nowe wydarzenie</DialogTitle>
                    <DialogDescription>Utwórz nowe wydarzenie. Automatycznie zostaną dodane fazy: przyjmowanie, sprzedaż, wypłaty.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <Input placeholder="Nazwa wydarzenia" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                        {error && <p className="text-destructive text-sm">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Anuluj
                        </Button>
                        <Button type="submit" disabled={!name.trim() || isSubmitting}>
                            {isSubmitting ? "Tworzenie..." : "Utwórz"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
