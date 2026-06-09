"use client";

import { ArrowLeft01Icon, ArrowLeftDoubleIcon, ArrowRight01Icon, ArrowRightDoubleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { PaginationState } from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS } from "./logs-utils";

interface LogsPaginationProps {
    pagination: PaginationState;
    onPaginationChange: (next: PaginationState) => void;
    rowCount: number;
    filteredRowCount: number;
}

export function LogsPagination({ pagination, onPaginationChange, rowCount, filteredRowCount }: LogsPaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { pageIndex, pageSize } = pagination;
    const pageCount = rowCount > 0 ? Math.ceil(rowCount / pageSize) : 0;
    const canPrevious = pageIndex > 0;
    const canNext = pageIndex < pageCount - 1;

    const buildPageUrl = (newPageIndex: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(newPageIndex));
        return `?${params.toString()}`;
    };

    return (
        <div className="flex items-center justify-between gap-4 px-2 py-3">
            <div className="flex-1 text-muted-foreground text-sm">{filteredRowCount} wpisów</div>
            {pageCount > 0 && (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground text-xs">Widok</span>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(value) => {
                                if (value == null) return;
                                onPaginationChange({ pageIndex: 0, pageSize: Number(value) });
                            }}
                        >
                            <SelectTrigger size="sm" className="w-17.5">
                                <SelectValue>{(value: string) => value ?? "50"}</SelectValue>
                            </SelectTrigger>
                            <SelectContent side="top" align="center">
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <span className="text-muted-foreground text-xs tabular-nums">
                        {pageIndex + 1} z {pageCount}
                    </span>
                    <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon-sm" onClick={() => onPaginationChange({ ...pagination, pageIndex: 0 })} disabled={!canPrevious} onMouseEnter={() => router.prefetch(buildPageUrl(0))}>
                            <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => onPaginationChange({ ...pagination, pageIndex: pageIndex - 1 })} disabled={!canPrevious} onMouseEnter={() => router.prefetch(buildPageUrl(pageIndex - 1))}>
                            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => onPaginationChange({ ...pagination, pageIndex: pageIndex + 1 })} disabled={!canNext} onMouseEnter={() => router.prefetch(buildPageUrl(pageIndex + 1))}>
                            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => onPaginationChange({ ...pagination, pageIndex: pageCount - 1 })} disabled={!canNext} onMouseEnter={() => router.prefetch(buildPageUrl(pageCount - 1))}>
                            <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
