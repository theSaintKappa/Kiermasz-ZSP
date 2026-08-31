"use client";

import { BarcodeIcon, BookImageIcon, Building06Icon, CalendarMortarboardIcon, HoldLocked01Icon, ShoppingCartAdd01Icon, ShoppingCartCheck01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/format-utils";
import { getCoverUrl } from "@/lib/storage-utils";
import { type CartItem, useCartStore } from "@/stores/cart-store";
import { LEVEL_SHORT_LABELS, type SalesSearchItem, type SellerGroup } from "./sales-utils";

interface SellerCardProps {
    group: SellerGroup;
}

export function SellerCard({ group }: SellerCardProps) {
    const addItem = useCartStore((s) => s.addItem);
    const cartItems = useCartStore((s) => s.items);

    const handleAdd = (item: SalesSearchItem) => {
        const cartItem: CartItem = {
            itemId: item.itemId,
            titleId: item.titleId,
            sellerId: group.sellerId,
            sellerFirstName: group.firstName,
            sellerLastName: group.lastName,
            classSymbol: group.classSymbol,
            title: item.title,
            subtitle: item.subtitle,
            isbn: item.isbn,
            price: item.price,
            level: item.level,
            publisher: item.publisher,
            publishingYear: item.publishingYear,
            subjectName: item.subjectName,
        };
        addItem(cartItem);
    };

    return (
        <div className="mb-3 flex break-inside-avoid flex-col rounded-lg border bg-card">
            {/* Seller header */}
            <div className="flex items-center gap-2 border-b px-3 py-2">
                <Link href={`/dashboard/sellers/${group.sellerId}`} className="truncate font-medium text-sm hover:underline">
                    {group.firstName} {group.lastName}
                </Link>
                <span className="shrink-0 text-muted-foreground text-xs">{group.classSymbol}</span>
                <span className="ml-auto shrink-0 text-muted-foreground text-xs">{group.items.length} szt.</span>
            </div>

            {/* Items */}
            <div className="divide-y">
                {group.items.map((item) => {
                    const inCart = cartItems.some((c) => c.itemId === item.itemId);
                    const isReserved = item.status === "reserved";
                    const coverUrl = getCoverUrl(item.coverPath);

                    return (
                        <div key={item.itemId} className="flex items-center gap-2.5 px-3 py-2">
                            {/* Cover thumbnail */}
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
                                <div className="flex items-center gap-1.5">
                                    <span className="truncate text-sm">{item.title}</span>
                                    {item.level !== "basic" && (
                                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                                            {LEVEL_SHORT_LABELS[item.level]}
                                        </Badge>
                                    )}
                                </div>
                                {item.subtitle && <p className="truncate text-muted-foreground text-xs">{item.subtitle}</p>}
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-muted-foreground text-xs">
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

                            {/* Price + add button */}
                            <div className="flex shrink-0 items-center gap-2">
                                <span className="whitespace-nowrap font-medium text-sm">{formatPrice(item.price)}</span>
                                {isReserved ? (
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <span className="inline-block w-fit">
                                                    <Button size="icon-lg" variant="ghost" disabled>
                                                        <HugeiconsIcon icon={HoldLocked01Icon} strokeWidth={1.75} />
                                                    </Button>
                                                </span>
                                            }
                                        />
                                        <TooltipContent>
                                            <p>Podręcznik zarezerwowany</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ) : inCart ? (
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <span className="inline-block w-fit">
                                                    <Button size="icon-lg" variant="ghost" disabled>
                                                        <HugeiconsIcon icon={ShoppingCartCheck01Icon} strokeWidth={1.75} />
                                                    </Button>
                                                </span>
                                            }
                                        />
                                        <TooltipContent>
                                            <p>Podręcznik już znajduje się w koszyku</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <Tooltip>
                                        <TooltipTrigger render={<Button size="icon-lg" variant="ghost" onClick={() => handleAdd(item)} />}>
                                            <HugeiconsIcon icon={ShoppingCartAdd01Icon} strokeWidth={1.75} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Dodaj do koszyka</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
