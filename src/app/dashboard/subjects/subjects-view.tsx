"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/user-store";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { EditSubjectDialog } from "./edit-subject-dialog";
import { type SubjectRow, SubjectsTable } from "./subjects-table";

interface SubjectsViewProps {
    subjects: SubjectRow[];
}

export function SubjectsView({ subjects }: SubjectsViewProps) {
    const role = useUserStore((s) => s.role);
    const initializeUser = useUserStore((s) => s.initialize);
    const isAdmin = role === "admin" || role === "super_admin";

    const [editSubject, setEditSubject] = useState<SubjectRow | null>(null);
    const [deleteSubject, setDeleteSubject] = useState<SubjectRow | null>(null);

    useEffect(() => {
        initializeUser();
    }, [initializeUser]);

    return (
        <div className="flex w-full flex-col gap-4">
            <SubjectsTable subjects={subjects} isAdmin={isAdmin} onEdit={setEditSubject} onDelete={setDeleteSubject} />
            <EditSubjectDialog
                open={!!editSubject}
                onOpenChange={(open) => {
                    if (!open) setEditSubject(null);
                }}
                subject={editSubject}
            />
            <ConfirmDeleteDialog
                open={!!deleteSubject}
                onOpenChange={(open) => {
                    if (!open) setDeleteSubject(null);
                }}
                subject={deleteSubject}
            />
        </div>
    );
}
