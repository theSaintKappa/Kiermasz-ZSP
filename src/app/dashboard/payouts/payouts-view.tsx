"use client";

import { AiSearch02Icon, ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon, CryingIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Item, ItemActions, ItemContent } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { formatPrice } from "@/lib/format-utils";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/stores/user-store";
import { ConfirmPayoutDialog } from "./confirm-payout-dialog";
import { ConfirmUndoPayoutDialog } from "./confirm-undo-payout-dialog";
import { PayoutCard } from "./payout-card";
import { PAGE_SIZE, type PayoutSellerRow, type PayoutSummary, sellerCountLabel } from "./payouts-utils";

interface PayoutsViewProps {
    sellers: PayoutSellerRow[];
    totalCount: number;
    page: number;
    query: string;
    unpaid: boolean;
    summary: PayoutSummary | null;
}

export function PayoutsView({ sellers, totalCount, page, query, unpaid, summary }: PayoutsViewProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isSuperAdmin = useUserStore((s) => s.isSuperAdmin);
    const [isPending, startTransition] = useTransition();

    const [queryState, setQueryState] = useState(query);
    const inputRef = useRef<HTMLInputElement>(null);

    const [confirmTarget, setConfirmTarget] = useState<PayoutSellerRow | null>(null);
    const [undoTarget, setUndoTarget] = useState<PayoutSellerRow | null>(null);

    const hasQuery = query.trim().length > 0;

    // Sync query to URL — debounced, skip when already in sync
    useEffect(() => {
        const trimmed = queryState.trim();
        if (trimmed === query) return;
        const timer = setTimeout(() => {
            const params = new URLSearchParams();
            if (trimmed) params.set("q", trimmed);
            if (unpaid) params.set("unpaid", "1");
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }, 300);
        return () => clearTimeout(timer);
    }, [queryState, query, unpaid, pathname, router]);

    // Realtime: refresh when payouts change
    useEffect(() => {
        const supabase = createClient();
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const refresh = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => router.refresh(), 500);
        };
        const channel = supabase.channel("payouts-realtime").on("postgres_changes", { event: "*", schema: "public", table: "payouts" }, refresh).subscribe();
        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            supabase.removeChannel(channel);
        };
    }, [router]);

    const handleSearchbarClear = () => {
        setQueryState("");
        inputRef.current?.focus();
    };

    const gotoPage = (n: number) => {
        const params = new URLSearchParams(searchParams.toString());
        if (n > 0) {
            params.set("page", String(n));
        } else {
            params.delete("page");
        }
        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    };

    const toggleUnpaid = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (unpaid) params.delete("unpaid");
        else params.set("unpaid", "1");
        params.delete("page");
        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    };

    const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    return (
        <div className="flex w-full flex-col gap-4">
            {/* Searchbar */}
            <div className="flex items-center gap-2">
                <InputGroup className="h-12 flex-1">
                    <InputGroupInput ref={inputRef} value={queryState} onChange={(e) => setQueryState(e.target.value)} placeholder="Nazwisko, imię lub klasa…" className="text-base!" />
                    <InputGroupAddon>
                        <HugeiconsIcon icon={AiSearch02Icon} />
                    </InputGroupAddon>
                    {hasQuery && (
                        <InputGroupAddon align="inline-end">
                            {totalCount} {sellerCountLabel(totalCount)}
                            <InputGroupButton size="icon-xs" onClick={handleSearchbarClear}>
                                <HugeiconsIcon icon={Cancel01Icon} />
                            </InputGroupButton>
                        </InputGroupAddon>
                    )}
                </InputGroup>
            </div>

            {/* Summary strip */}
            {summary && (
                <Item variant="outline">
                    <ItemContent className="flex-row gap-4">
                        <span>
                            Wypłacono <span className="font-semibold">{summary.sellersPaid}</span>/{summary.sellersTotal}
                        </span>
                        <Separator orientation="vertical" />
                        <span>
                            Pozostało <span className="font-semibold">{formatPrice(summary.owedTotal - summary.paidTotal)}</span>
                        </span>
                        <Separator orientation="vertical" />
                        <span>
                            <span className="font-semibold">{summary.booksToReturn}</span> podręczników do zwrotu
                        </span>
                    </ItemContent>
                    <ItemActions>
                        <Field orientation="horizontal">
                            <Switch id="toggle-unpaid" checked={unpaid} onCheckedChange={toggleUnpaid} />
                            <FieldLabel htmlFor="toggle-unpaid">Ukryj wypłaconych</FieldLabel>
                        </Field>
                    </ItemActions>
                </Item>
            )}

            {/* Content */}
            <div className={isPending ? "opacity-50 transition-opacity" : ""}>
                {!hasQuery && sellers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <HugeiconsIcon icon={CryingIcon} className="mb-3 size-8 opacity-30" />
                        <p className="text-sm">Brak sprzedawców.</p>
                    </div>
                ) : hasQuery && sellers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <HugeiconsIcon icon={CryingIcon} className="mb-3 size-8 opacity-30" />
                        <p className="text-sm">Brak wyników dla &ldquo;{query}&rdquo;</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {sellers.map((s) => (
                            <PayoutCard key={s.sellerId} seller={s} isSuperAdmin={isSuperAdmin} onConfirm={setConfirmTarget} onUndo={setUndoTarget} />
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalCount > PAGE_SIZE && (
                <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="icon" disabled={page === 0} onClick={() => gotoPage(page - 1)}>
                        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
                    </Button>
                    <span className="text-muted-foreground text-sm tabular-nums">
                        Strona {page + 1} z {pageCount}
                    </span>
                    <Button variant="ghost" size="icon" disabled={(page + 1) * PAGE_SIZE >= totalCount} onClick={() => gotoPage(page + 1)}>
                        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
                    </Button>
                </div>
            )}

            <ConfirmPayoutDialog
                open={!!confirmTarget}
                onOpenChange={(open) => {
                    if (!open) setConfirmTarget(null);
                }}
                seller={confirmTarget}
            />
            <ConfirmUndoPayoutDialog
                open={!!undoTarget}
                onOpenChange={(open) => {
                    if (!open) setUndoTarget(null);
                }}
                seller={undoTarget}
            />
        </div>
    );
}
