"use client";

import { AlertCircleIcon, BarcodeIcon, BookImageIcon, BookUserIcon, Building06Icon, CalendarMortarboardIcon, Cancel01Icon, CheckmarkCircle02Icon, Delete02Icon, HoldLocked01Icon, ShoppingCart01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { completeSale, verifyCartItems } from "@/actions/sale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getCurrentPhase } from "@/lib/event-utils";
import { formatPrice } from "@/lib/format-utils";
import { getCoverUrl } from "@/lib/storage-utils";
import { cn } from "@/lib/utils";
import { cartTotal, useCartStore } from "@/stores/cart-store";
import { useEventStore } from "@/stores/event-store";
import { LEVEL_SHORT_LABELS } from "../sales/sales-utils";
import { CheckoutStrip } from "./checkout-strip";
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
    const [checkoutMode, setCheckoutMode] = useState(false);

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
                setCheckoutMode(false);
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
            <Popover
                open={open}
                onOpenChange={(v) => {
                    setOpen(v);
                    if (!v) setCheckoutMode(false);
                }}
            >
                <PopoverTrigger className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/80">
                    <HugeiconsIcon icon={ShoppingCart01Icon} className="size-7" strokeWidth={1.75} />
                    {count > 0 && (
                        <Badge variant="secondary" className="-top-1 -right-1 absolute h-5 min-w-5 justify-center px-1 text-xs">
                            {count}
                        </Badge>
                    )}
                </PopoverTrigger>
                <PopoverContent side="top" align="end" sideOffset={8} className="w-134 max-w-[calc(100vw-2rem)] p-0">
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
                                    const coverUrl = getCoverUrl(item.coverPath);
                                    return (
                                        <div key={item.itemId} className={cn("flex items-center gap-2.5 px-4 py-2", isConflict && "bg-destructive/5")}>
                                            {/* Cover */}
                                            <div className="aspect-210/297 h-14">
                                                {coverUrl ? (
                                                    <Image src={coverUrl} alt={item.title} width={64} height={88} className="size-full shrink-0 rounded object-cover" />
                                                ) : (
                                                    <div className="flex size-full shrink-0 items-center justify-center rounded border border-dashed bg-muted">
                                                        <HugeiconsIcon icon={BookImageIcon} className="size-5 text-muted-foreground/40" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-sm">{item.title}</span>
                                                    {item.level !== "basic" && (
                                                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                                                            {LEVEL_SHORT_LABELS[item.level]}
                                                        </Badge>
                                                    )}
                                                    {isConflict && (
                                                        <Badge variant="destructive" className="shrink-0 text-[10px]">
                                                            Niedostępny
                                                        </Badge>
                                                    )}
                                                </div>
                                                {item.subtitle && <p className="truncate text-muted-foreground text-xs">{item.subtitle}</p>}
                                                <div className="flex flex-wrap items-center gap-x-2 text-muted-foreground text-xs">
                                                    {item.publisher && (
                                                        <span className="flex items-center gap-0.5">
                                                            <HugeiconsIcon className="size-2.5" icon={Building06Icon} />
                                                            {item.publisher}
                                                        </span>
                                                    )}
                                                    {item.publishingYear && (
                                                        <span className="flex items-center gap-0.5">
                                                            <HugeiconsIcon className="size-2.5" icon={CalendarMortarboardIcon} />
                                                            {item.publishingYear}
                                                        </span>
                                                    )}
                                                    {item.isbn && (
                                                        <span className="flex items-center gap-0.5 font-mono">
                                                            <HugeiconsIcon className="size-2.5" icon={BarcodeIcon} />
                                                            {item.isbn}
                                                        </span>
                                                    )}
                                                    <Link href={`/dashboard/sellers/${item.sellerId}`} className="flex items-center gap-0.5 font-medium hover:underline">
                                                        <HugeiconsIcon className="size-2.5" icon={BookUserIcon} />
                                                        {item.sellerFirstName} {item.sellerLastName}
                                                        <span className="text-muted-foreground">{item.classSymbol}</span>
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* Price + remove */}
                                            <span className="shrink-0 font-medium text-sm">{formatPrice(item.price)}</span>
                                            <Tooltip>
                                                <TooltipTrigger render={<Button size="icon-sm" variant="ghost" onClick={() => removeItem(item.itemId)} />}>
                                                    <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                                                </TooltipTrigger>
                                                <TooltipContent>Usuń z koszyka</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Actions */}
                        {count > 0 && (
                            <>
                                <Separator />
                                {checkoutMode ? (
                                    <CheckoutStrip total={total} isSelling={isSelling} hasConflicts={hasConflicts} onConfirm={handleSell} onBack={() => setCheckoutMode(false)} />
                                ) : (
                                    <div className="flex flex-col gap-2 p-3">
                                        <Button className="w-full" onClick={() => setCheckoutMode(true)} disabled={hasConflicts}>
                                            <HugeiconsIcon icon={CheckmarkCircle02Icon} />
                                            Sprzedaj
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" className="flex-1" onClick={() => setReserveOpen(true)} disabled={hasConflicts}>
                                                <HugeiconsIcon icon={HoldLocked01Icon} />
                                                Zarezerwuj
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="text-destructive"
                                                onClick={() => {
                                                    clear();
                                                    setCheckoutMode(false);
                                                }}
                                            >
                                                <HugeiconsIcon icon={Delete02Icon} />
                                                Wyczyść
                                            </Button>
                                        </div>
                                    </div>
                                )}
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
