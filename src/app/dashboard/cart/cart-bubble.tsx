"use client";

import { AlertCircleIcon, Cancel01Icon, Delete02Icon, HoldLocked01Icon, Loading03Icon, ShoppingCart01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { completeSale, verifyCartItems } from "@/actions/sale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { getCurrentPhase } from "@/lib/event-utils";
import { formatPrice } from "@/lib/format-utils";
import { cartTotal, useCartStore } from "@/stores/cart-store";
import { useEventStore } from "@/stores/event-store";
import { ReservationSuccessDialog } from "./reservation-success-dialog";
import { ReserveDialog } from "./reserve-dialog";

export function CartBubble() {
    const selectedEventId = useEventStore((s) => s.selectedEventId);
    const isLoading = useEventStore((s) => s.isLoading);
    const events = useEventStore((s) => s.events);
    const event = events.find((e) => e.id === selectedEventId);

    const items = useCartStore((s) => s.items);
    const conflictIds = useCartStore((s) => s.conflictIds);
    const removeItem = useCartStore((s) => s.removeItem);
    const clear = useCartStore((s) => s.clear);
    const setConflicts = useCartStore((s) => s.setConflicts);
    const syncEvent = useCartStore((s) => s.syncEvent);

    const [open, setOpen] = useState(false);
    const [isSelling, setIsSelling] = useState(false);
    const [reserveOpen, setReserveOpen] = useState(false);
    const [successData, setSuccessData] = useState<{ number: string; expiresOn: string } | null>(null);

    const currentPhase = event ? getCurrentPhase(event.phases) : null;
    const isSellingPhase = currentPhase?.phase === "selling";

    // Sync cart with event — only after event store has hydrated
    useEffect(() => {
        if (isLoading) return;
        syncEvent(selectedEventId);
    }, [selectedEventId, syncEvent, isLoading]);

    // Verify cart items on popover open
    const verifyCart = useCallback(async () => {
        if (items.length === 0) return;
        try {
            const conflicts = await verifyCartItems(items.map((i) => i.itemId));
            if (conflicts.length > 0) {
                setConflicts(conflicts);
            }
        } catch {
            // silently ignore — checkout RPC will catch anyway
        }
    }, [items, setConflicts]);

    useEffect(() => {
        if (open) verifyCart();
    }, [open, verifyCart]);

    // Realtime: verify cart when textbook_items change
    useEffect(() => {
        if (!selectedEventId) return;
        const { createClient } = require("@/lib/supabase/client");
        const supabase = createClient();

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const channel = supabase
            .channel("cart-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "textbook_items", filter: `event_id=eq.${selectedEventId}` }, () => {
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    if (items.length > 0) verifyCart();
                }, 500);
            })
            .subscribe();

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            supabase.removeChannel(channel);
        };
    }, [selectedEventId, items.length, verifyCart]);

    const handleSell = async () => {
        if (items.length === 0) return;
        setIsSelling(true);
        try {
            const result = await completeSale(items.map((i) => i.itemId));

            if (result.conflicts.length > 0) {
                setConflicts(result.conflicts.map((c) => c.itemId));

                const soldCount = result.sold.length;
                if (soldCount > 0) {
                    toast.success(`Sprzedano ${soldCount} ${soldCount === 1 ? "podręcznik" : "podręczników"}`);
                }
                toast.error(`${result.conflicts.length} ${result.conflicts.length === 1 ? "podręcznik jest niedostępny" : "podręczniki są niedostępne"}`);
            } else {
                const total = cartTotal(items);
                clear();
                setOpen(false);
                toast.success(`Sprzedano ${items.length} ${items.length === 1 ? "podręcznik" : "podręczniki"} — ${formatPrice(total)}`);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Błąd sprzedaży");
        } finally {
            setIsSelling(false);
        }
    };

    const handleReserveSuccess = (reservationNumber: string, expiresOn: string) => {
        clear();
        setOpen(false);
        setReserveOpen(false);
        setSuccessData({ number: reservationNumber, expiresOn });
    };

    if (!selectedEventId) return null;

    const count = items.length;
    const total = cartTotal(items);
    const hasConflicts = conflictIds.length > 0;

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/80">
                    <HugeiconsIcon icon={ShoppingCart01Icon} className="size-7" strokeWidth={1.75} />
                    {count > 0 && (
                        <Badge variant="secondary" className="-top-1 -right-1 absolute h-5 min-w-5 justify-center px-1 text-xs">
                            {count}
                        </Badge>
                    )}
                </PopoverTrigger>
                <PopoverContent side="top" align="end" sideOffset={8} className="w-104 max-w-[calc(100vw-2rem)] p-0">
                    <div className="flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">Koszyk</span>
                                {count > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {count} szt.
                                    </Badge>
                                )}
                            </div>
                            {count > 0 && <span className="font-semibold text-sm">{formatPrice(total)}</span>}
                        </div>

                        {/* Phase warning */}
                        {event && !isSellingPhase && (
                            <div className="flex items-center gap-2 border-b bg-amber-50 px-4 py-2 text-amber-800 text-xs dark:bg-amber-950 dark:text-amber-200">
                                <HugeiconsIcon icon={AlertCircleIcon} className="size-3.5 shrink-0" />
                                Faza sprzedaży nie jest aktywna
                            </div>
                        )}

                        {/* Items */}
                        {count === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <HugeiconsIcon icon={ShoppingCart01Icon} className="mb-2 size-6 opacity-30" />
                                <p className="text-sm">Koszyk jest pusty</p>
                            </div>
                        ) : (
                            <div className="max-h-[40vh] divide-y overflow-y-auto">
                                {items.map((item) => {
                                    const isConflict = conflictIds.includes(item.itemId);
                                    return (
                                        <div key={item.itemId} className={`flex items-center gap-2 px-4 py-2 ${isConflict ? "bg-destructive/5" : ""}`}>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm">{item.title}</p>
                                                <p className="truncate text-muted-foreground text-xs">
                                                    {item.sellerLastName} {item.sellerFirstName} · {item.classSymbol}
                                                </p>
                                                {isConflict && <p className="text-destructive text-xs">Niedostępny</p>}
                                            </div>
                                            <span className="shrink-0 font-medium text-sm">{formatPrice(item.price)}</span>
                                            <Button size="icon-sm" variant="ghost" onClick={() => removeItem(item.itemId)}>
                                                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Actions */}
                        {count > 0 && (
                            <>
                                <Separator />
                                <div className="flex flex-col gap-2 p-3">
                                    <Button className="w-full" onClick={handleSell} disabled={isSelling || hasConflicts}>
                                        {isSelling ? (
                                            <>
                                                <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
                                                Sprzedawanie…
                                            </>
                                        ) : (
                                            "Sprzedaj"
                                        )}
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" className="flex-1" onClick={() => setReserveOpen(true)} disabled={hasConflicts}>
                                            <HugeiconsIcon icon={HoldLocked01Icon} />
                                            Zarezerwuj
                                        </Button>
                                        <Button variant="ghost" className="text-destructive" onClick={clear}>
                                            <HugeiconsIcon icon={Delete02Icon} />
                                            Wyczyść
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            <ReserveDialog open={reserveOpen} onOpenChange={setReserveOpen} onSuccess={handleReserveSuccess} />

            {successData && (
                <ReservationSuccessDialog
                    open={!!successData}
                    onOpenChange={(open) => {
                        if (!open) setSuccessData(null);
                    }}
                    reservationNumber={successData.number}
                    expiresOn={successData.expiresOn}
                />
            )}
        </>
    );
}
