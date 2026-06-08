"use client";

import { Delete02Icon, Edit03Icon, PlusSignCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, type SortingState, useReactTable } from "@tanstack/react-table";
import { format } from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface AdminRow {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "admin" | "super_admin";
    createdAt: string;
}

interface AdminsTableProps {
    admins: AdminRow[];
    isSuperAdmin: boolean;
    currentUserId?: string;
    onEdit: (admin: AdminRow) => void;
    onDelete: (admin: AdminRow) => void;
    onAddClick: () => void;
}

export function AdminsTable({ admins, isSuperAdmin, currentUserId, onEdit, onDelete, onAddClick }: AdminsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const columns: ColumnDef<AdminRow>[] = [
        {
            accessorFn: (row) => `${row.firstName} ${row.lastName}`,
            id: "name",
            header: "Imię i nazwisko",
            cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span>,
        },
        {
            accessorKey: "role",
            header: "Rola",
            cell: ({ getValue }) => {
                const role = getValue<"admin" | "super_admin">();
                return <Badge variant={role === "super_admin" ? "default" : "secondary"}>{role === "super_admin" ? "Super Admin" : "Admin"}</Badge>;
            },
        },
        {
            accessorKey: "createdAt",
            header: "Utworzono",
            cell: ({ getValue }) => {
                const value = getValue<string>();
                if (!value) return <span className="text-muted-foreground">—</span>;
                return <span className="text-muted-foreground">{format(new Date(value), "dd.MM.yyyy HH:mm")}</span>;
            },
        },
        {
            id: "actions",
            header: () =>
                isSuperAdmin ? (
                    <div className="flex justify-end">
                        <Button size="sm" onClick={onAddClick}>
                            <HugeiconsIcon icon={PlusSignCircleIcon} />
                            Dodaj
                        </Button>
                    </div>
                ) : null,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-0.5">
                    {isSuperAdmin && (
                        <Tooltip>
                            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={() => onEdit(row.original)} />}>
                                <HugeiconsIcon icon={Edit03Icon} />
                                <span className="sr-only">Edytuj</span>
                            </TooltipTrigger>
                            <TooltipContent>Edytuj</TooltipContent>
                        </Tooltip>
                    )}
                    {isSuperAdmin &&
                        (row.original.id === currentUserId ? (
                            <Tooltip>
                                <TooltipTrigger render={<span className="inline-flex" />}>
                                    <Button variant="ghost" size="icon-sm" disabled>
                                        <HugeiconsIcon icon={Delete02Icon} className="text-destructive" />
                                        <span className="sr-only">Nie możesz usunąć siebie</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Nie możesz usunąć siebie</TooltipContent>
                            </Tooltip>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={() => onDelete(row.original)} />}>
                                    <HugeiconsIcon icon={Delete02Icon} className="text-destructive" />
                                    <span className="sr-only">Usuń</span>
                                </TooltipTrigger>
                                <TooltipContent>Usuń</TooltipContent>
                            </Tooltip>
                        ))}
                </div>
            ),
            enableSorting: false,
        },
    ];

    const table = useReactTable({
        data: admins,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="w-full overflow-hidden rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="bg-accent hover:bg-accent">
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} className="bg-muted/30">
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                Brak administratorów.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
