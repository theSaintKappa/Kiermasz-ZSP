"use client";

import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, type PaginationState, type SortingState, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { LogsPagination } from "./pagination";

interface LogsTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pagination: PaginationState;
    onPaginationChange: (next: PaginationState) => void;
    sorting: SortingState;
    onSortingChange?: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
    rowCount: number;
    isLoading: boolean;
}

export function LogsTable<TData, TValue>({ columns, data, pagination, onPaginationChange, sorting, onSortingChange, rowCount, isLoading }: LogsTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        state: { pagination, sorting },
        manualPagination: true,
        manualSorting: true,
        rowCount,
        onSortingChange,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="relative flex flex-col">
            {isLoading && data.length > 0 && (
                <div className="absolute top-0 left-0 z-10 h-0.5 w-full bg-primary/20">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
                </div>
            )}
            <div className={cn("overflow-hidden rounded-md border", isLoading && data.length > 0 && "opacity-60")}>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="odd:bg-muted/20 even:bg-muted/10 hover:bg-muted/30">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-4 animate-spin" />
                                        Ładowanie wpisów...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    Brak wpisów spełniających podane kryteria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <LogsPagination pagination={pagination} onPaginationChange={onPaginationChange} rowCount={rowCount} filteredRowCount={rowCount} />
        </div>
    );
}
