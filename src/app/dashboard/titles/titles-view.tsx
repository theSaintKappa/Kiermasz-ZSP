"use client";

import { PlusSignCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxContent, ComboboxEmpty, ComboboxItem, ComboboxList, ComboboxValue, useComboboxAnchor } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { CreateTitleDialog, type TextbookRow } from "./create-title-dialog";
import { TextbookCard } from "./textbook-card";

export interface TextbookGroup {
    subjectName: string;
    textbooks: TextbookRow[];
}

interface TitlesViewProps {
    groups: TextbookGroup[];
    subjectNames: Map<string, string>;
}

export function TitlesView({ groups, subjectNames }: TitlesViewProps) {
    const router = useRouter();
    const anchor = useComboboxAnchor();
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTitle, setEditingTitle] = useState<TextbookRow | null>(null);
    const [deletingTitle, setDeletingTitle] = useState<TextbookRow | null>(null);
    const [createKey, setCreateKey] = useState(0);

    const subjectsInGrid = new Set<string>();
    for (const group of groups) {
        for (const t of group.textbooks) {
            if (t.subject_id) subjectsInGrid.add(t.subject_id);
        }
    }
    const availableSubjectIds = Array.from(subjectNames.keys()).filter((id) => subjectsInGrid.has(id));

    const filteredGroups =
        selectedSubjects.length === 0
            ? groups
            : groups
                  .map((g) => ({
                      ...g,
                      textbooks: g.textbooks.filter((t) => t.subject_id && selectedSubjects.includes(t.subject_id)),
                  }))
                  .filter((g) => g.textbooks.length > 0);

    const handleSuccess = () => {
        setCreateKey((k) => k + 1);
        router.refresh();
    };

    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex justify-between gap-4">
                <Combobox multiple autoHighlight items={availableSubjectIds} itemToStringLabel={(id: string) => subjectNames.get(id) ?? id} value={selectedSubjects} onValueChange={setSelectedSubjects}>
                    <ComboboxChips ref={anchor} className="w-full max-w-xs">
                        <ComboboxValue>
                            {(values: string[]) => (
                                <>
                                    {values.map((id) => (
                                        <ComboboxChip key={id}>{subjectNames.get(id) ?? id}</ComboboxChip>
                                    ))}
                                    <ComboboxChipsInput placeholder={values.length === 0 ? "Filtruj przedmioty..." : undefined} className="placeholder:text-muted-foreground" />
                                </>
                            )}
                        </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxContent anchor={anchor}>
                        <ComboboxEmpty>Nie znaleziono przedmiotu.</ComboboxEmpty>
                        <ComboboxList>
                            {(id: string) => (
                                <ComboboxItem key={id} value={id}>
                                    {subjectNames.get(id)}
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
                <Button onClick={() => setDialogOpen(true)}>
                    <HugeiconsIcon icon={PlusSignCircleIcon} />
                    Dodaj tytuł
                </Button>
            </div>

            {filteredGroups.length === 0 ? (
                <p className="mt-2 text-center text-muted-foreground text-sm">Brak podręczników.</p>
            ) : (
                <div className="flex flex-col gap-8">
                    {filteredGroups.map((group) => (
                        <section key={group.subjectName}>
                            <h3 className="mb-3 flex items-end justify-between font-semibold text-lg">
                                {group.subjectName}
                                <span className="font-normal text-muted-foreground text-sm">
                                    {group.textbooks.length} {group.textbooks.length === 1 ? "tytuł" : group.textbooks.length < 5 ? "tytuły" : "tytułów"}
                                </span>
                            </h3>
                            <Separator className="mb-4" />
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                                {group.textbooks.map((t) => (
                                    <TextbookCard
                                        key={t.id}
                                        textbook={t}
                                        onEdit={(textbook) => {
                                            setEditingTitle(textbook);
                                            setDialogOpen(true);
                                        }}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <CreateTitleDialog
                key={createKey}
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setEditingTitle(null);
                }}
                title={editingTitle}
                onSuccess={handleSuccess}
                onDelete={() => {
                    if (editingTitle) {
                        setDeletingTitle(editingTitle);
                    }
                }}
            />
            <ConfirmDeleteDialog
                open={!!deletingTitle}
                onOpenChange={(open) => {
                    if (!open) setDeletingTitle(null);
                }}
                textbook={deletingTitle}
                onDeleted={handleSuccess}
            />
        </div>
    );
}
