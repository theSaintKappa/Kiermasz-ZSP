"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/user-store";
import { type AdminRow, AdminsTable } from "./admins-table";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { CreateAdminDialog } from "./create-admin-dialog";
import { EditAdminDialog } from "./edit-admin-dialog";

interface AdminsViewProps {
    admins: AdminRow[];
    currentUserId?: string;
}

export function AdminsView({ admins, currentUserId }: AdminsViewProps) {
    const isSuperAdmin = useUserStore((s) => s.isSuperAdmin);
    const initializeUser = useUserStore((s) => s.initialize);
    const [createOpen, setCreateOpen] = useState(false);
    const [editAdmin, setEditAdmin] = useState<AdminRow | null>(null);
    const [deleteAdmin, setDeleteAdmin] = useState<AdminRow | null>(null);

    useEffect(() => {
        initializeUser();
    }, [initializeUser]);

    return (
        <div className="flex w-full flex-col gap-4">
            <AdminsTable admins={admins} isSuperAdmin={isSuperAdmin} currentUserId={currentUserId} onEdit={setEditAdmin} onDelete={setDeleteAdmin} onAddClick={() => setCreateOpen(true)} />
            <CreateAdminDialog open={createOpen} onOpenChange={setCreateOpen} />
            <EditAdminDialog
                open={!!editAdmin}
                onOpenChange={(open) => {
                    if (!open) setEditAdmin(null);
                }}
                admin={editAdmin}
            />
            <ConfirmDeleteDialog
                open={!!deleteAdmin}
                onOpenChange={(open) => {
                    if (!open) setDeleteAdmin(null);
                }}
                admin={deleteAdmin}
            />
        </div>
    );
}
