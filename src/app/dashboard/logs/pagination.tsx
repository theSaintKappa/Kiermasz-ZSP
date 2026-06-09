"use client";

import { ArrowLeft01Icon, ArrowLeftDoubleIcon, ArrowRight01Icon, ArrowRightDoubleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LogsPaginationProps<TData> {
    table: Table<TData>;
}

// TODO: Pagination is (kind of) broken
export function LogsPagination<TData>({ table }: LogsPaginationProps<TData>) {
    return (
        <div className="flex items-center justify-between gap-4 px-2 py-3">
            <div className="flex-1 text-muted-foreground text-sm">{table.getFilteredRowModel().rows.length} wpisów</div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-xs">Widok</span>
                    <Select
                        value={String(table.getState().pagination.pageSize)}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger size="sm" className="w-17.5">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top" align="center">
                            {[25, 50, 100, 200].map((pageSize) => (
                                <SelectItem key={pageSize} value={String(pageSize)}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <span className="text-muted-foreground text-xs tabular-nums">
                    {table.getState().pagination.pageIndex + 1} z {table.getPageCount() || 1}
                </span>
                <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon-sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                        <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                        <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
