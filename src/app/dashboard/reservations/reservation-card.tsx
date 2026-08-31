"use client";

import { BarcodeIcon, BookImageIcon, BookUserIcon, Building06Icon, CalendarMortarboardIcon, CheckmarkCircle01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-utils";
import { getCoverUrl } from "@/lib/storage-utils";
import { isExpired, LEVEL_SHORT_LABELS, type ReservationRow } from "./reservations-utils";

interface ReservationCardProps {
    reservation: ReservationRow;
    onFulfill: (r: ReservationRow) => void;
    onCancel: (r: ReservationRow) => void;
}

export function ReservationCard({ reservation, onFulfill, onCancel }: ReservationCardProps) {
    const expired = isExpired(reservation.expiresAt);

    return (
        <div className={`flex flex-col rounded-lg border bg-card ${expired ? "border-destructive/40" : ""}`}>
            {/* Header */}
            <div className="flex items-center gap-4 border-b px-4 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex flex-col items-center">
                        <span className="font-bold font-mono text-xl tracking-wider">{reservation.reservationNumber}</span>
                        <span className="font-medium text-muted-foreground text-xs">
                            {reservation.firstName} {reservation.lastName}
                        </span>
                    </div>
                    {expired && (
                        <Badge variant="destructive" className="text-xs">
                            Wygasła
                        </Badge>
                    )}
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs">Łącznie</span>
                    <span className="font-semibold">{formatPrice(reservation.total)}</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                    <Button size="sm" onClick={() => onFulfill(reservation)}>
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} />
                        Zrealizuj
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => onCancel(reservation)}>
                        <HugeiconsIcon icon={Delete02Icon} />
                        Anuluj
                    </Button>
                </div>
            </div>

            {/* Items */}
            <div className="divide-y">
                {reservation.items.map((item) => {
                    const coverUrl = getCoverUrl(item.coverPath);
                    return (
                        <div key={item.itemId} className="flex items-center gap-2.5 px-4 py-2">
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

                            {/* Price */}
                            <span className="shrink-0 font-medium text-sm">{formatPrice(item.price)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
