"use client";

import { BarcodeIcon, BookImageIcon, Building06Icon, CalendarMortarboardIcon, ChevronDownIcon, PrinterIcon, RotateLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/format-utils";
import { getCoverUrl } from "@/lib/storage-utils";
import { cn } from "@/lib/utils";
import { LEVEL_SHORT_LABELS } from "../transactions/transactions-utils";
import type { PayoutItemRow, PayoutSellerRow } from "./payouts-utils";
import { formatReceiptNumber, textbookCountLabel, textbookReturnCountLabel } from "./payouts-utils";

interface PayoutCardProps {
    seller: PayoutSellerRow;
    isSuperAdmin: boolean;
    onConfirm: (s: PayoutSellerRow) => void;
    onUndo: (s: PayoutSellerRow) => void;
    onPrint: (s: PayoutSellerRow) => void;
}

export function PayoutCard({ seller, isSuperAdmin, onConfirm, onUndo, onPrint }: PayoutCardProps) {
    const payout = seller.payout;
    const initials = `${seller.firstName[0] ?? ""}${seller.lastName[0] ?? ""}`.toUpperCase();

    return (
        <div className={cn("flex flex-col rounded-lg border bg-card", payout && "border-emerald-500/50 bg-emerald-500/5")}>
            {/* Header */}
            <div className="flex items-center gap-4 border-b px-4 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-xs">{initials}</div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <Link href={`/dashboard/inventory/${seller.sellerId}`} className="truncate font-semibold text-sm hover:underline">
                            {seller.firstName} {seller.lastName}
                        </Link>
                        <span className="shrink-0 text-muted-foreground text-xs">{seller.classSymbol}</span>
                        {payout && (
                            <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                Wypłacono
                            </Badge>
                        )}
                    </div>
                    <span className="text-muted-foreground text-xs">
                        {seller.soldItems.length + seller.unsoldItems.length} {textbookCountLabel(seller.soldItems.length + seller.unsoldItems.length)}
                    </span>
                </div>

                {/* Right cluster */}
                {payout ? (
                    <div className="flex shrink-0 items-center gap-3">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-muted-foreground text-xs">{formatReceiptNumber(payout.receiptNumber)}</span>
                                <span className="font-semibold text-lg">{formatPrice(payout.amount)}</span>
                            </div>
                            {payout.returnedCount > 0 && (
                                <span className="text-muted-foreground text-xs">
                                    {payout.returnedCount} {textbookCountLabel(payout.returnedCount)} {textbookReturnCountLabel(payout.returnedCount)}
                                </span>
                            )}
                        </div>
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <span className="inline-block w-fit">
                                        <Button size="icon-xs" variant="ghost" className="text-muted-foreground" onClick={() => onPrint(seller)}>
                                            <HugeiconsIcon icon={PrinterIcon} className="size-4" />
                                        </Button>
                                    </span>
                                }
                            />
                            <TooltipContent>
                                <p>Drukuj potwierdzenie</p>
                            </TooltipContent>
                        </Tooltip>
                        {isSuperAdmin && (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <span className="inline-block w-fit">
                                            <Button size="icon-xs" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => onUndo(seller)}>
                                                <HugeiconsIcon icon={RotateLeft01Icon} className="size-4" />
                                            </Button>
                                        </span>
                                    }
                                />
                                <TooltipContent>
                                    <p>Cofnij wypłatę</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                ) : (
                    <div className="flex shrink-0 items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="font-semibold text-lg">{formatPrice(seller.owedTotal)}</span>
                            {seller.toReturnCount > 0 && (
                                <span className="text-muted-foreground text-xs">
                                    {seller.toReturnCount} {textbookCountLabel(seller.toReturnCount)} do zwrotu
                                </span>
                            )}
                        </div>
                        {isSuperAdmin ? (
                            <Button size="lg" onClick={() => onConfirm(seller)}>
                                {seller.owedTotal === 0 ? "Potwierdź odbiór" : `Wypłać`}
                            </Button>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <span className="inline-block w-fit">
                                            <Button size="lg" disabled>
                                                Wypłać
                                            </Button>
                                        </span>
                                    }
                                />
                                <TooltipContent>
                                    <p>Tylko super administrator może potwierdzać wypłaty</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                )}
            </div>

            {/* Collapsibles */}
            <div className="grid gap-4 p-4 md:grid-cols-2">
                <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-medium text-sm hover:bg-muted">
                        <span>
                            Sprzedane ({seller.soldItems.length}){seller.owedTotal > 0 && <span className="ml-2 font-normal text-muted-foreground">{formatPrice(seller.owedTotal)}</span>}
                        </span>
                        <HugeiconsIcon icon={ChevronDownIcon} className="size-4 text-muted-foreground transition-transform [[data-panel-open]>&]:rotate-180" />
                    </CollapsibleTrigger>
                    <div className="scroll-fade max-h-68 overflow-y-auto">
                        <CollapsibleContent>
                            {seller.soldItems.length === 0 ? (
                                <p className="px-1 py-2 text-muted-foreground text-sm">Brak podręczników.</p>
                            ) : (
                                <div className="divide-y">
                                    {seller.soldItems.map((item) => (
                                        <ItemRow key={item.itemId} item={item} isSold />
                                    ))}
                                </div>
                            )}
                        </CollapsibleContent>
                    </div>
                </Collapsible>

                <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-medium text-sm hover:bg-muted">
                        <span>
                            Do zwrotu ({seller.unsoldItems.length}){seller.toReturnCount > 0 && <span className="ml-2 font-normal text-muted-foreground">{seller.toReturnCount} szt.</span>}
                        </span>
                        <HugeiconsIcon icon={ChevronDownIcon} className="size-4 text-muted-foreground transition-transform [[data-panel-open]>&]:rotate-180" />
                    </CollapsibleTrigger>
                    <div className="scroll-fade max-h-68 overflow-y-auto">
                        <CollapsibleContent>
                            {seller.unsoldItems.length === 0 ? (
                                <p className="px-1 py-2 text-muted-foreground text-sm">Brak podręczników.</p>
                            ) : (
                                <div className="divide-y">
                                    {seller.unsoldItems.map((item) => (
                                        <ItemRow key={item.itemId} item={item} isSold={false} />
                                    ))}
                                </div>
                            )}
                        </CollapsibleContent>
                    </div>
                </Collapsible>
            </div>
        </div>
    );
}

function ItemRow({ item, isSold }: { item: PayoutItemRow; isSold: boolean }) {
    const coverUrl = getCoverUrl(item.coverPath);

    return (
        <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="aspect-210/297 h-14">
                {coverUrl ? (
                    <Image src={coverUrl} alt={item.title} width={64} height={88} className={cn("size-full shrink-0 rounded object-cover", isSold && "grayscale")} />
                ) : (
                    <div className="flex size-full shrink-0 items-center justify-center rounded border border-dashed bg-muted">
                        <HugeiconsIcon icon={BookImageIcon} className="size-5 text-muted-foreground/40" />
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm">{item.title}</span>
                    {item.level !== "basic" && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                            {LEVEL_SHORT_LABELS[item.level]}
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
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <span className={cn("font-medium text-sm", !isSold && "text-muted-foreground")}>{formatPrice(isSold ? (item.soldPrice ?? 0) : item.listPrice)}</span>
                {!isSold && item.status === "reserved" && (
                    <Badge variant="secondary" className="text-[10px]">
                        Zarezerwowany
                    </Badge>
                )}
            </div>
        </div>
    );
}
