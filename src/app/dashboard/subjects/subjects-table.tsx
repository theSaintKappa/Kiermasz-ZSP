"use client";

import { Delete02Icon, Edit03Icon, ListViewIcon, Loading03Icon, PlusSignCircleIcon, SolidLine01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type FormEvent, useState } from "react";
import { createSubject, createSubjects } from "@/actions/subject";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface SubjectRow {
    id: string;
    name: string;
    createdAt: string;
    textbookCount: number;
}

interface SubjectsTableProps {
    subjects: SubjectRow[];
    isAdmin: boolean;
    onEdit: (subject: SubjectRow) => void;
    onDelete: (subject: SubjectRow) => void;
}

export function SubjectsTable({ subjects, isAdmin, onEdit, onDelete }: SubjectsTableProps) {
    const [name, setName] = useState("");
    const [bulkMode, setBulkMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearInput = () => {
        setName("");
        setError(null);
    };

    const handleAdd = async (e: FormEvent) => {
        e.preventDefault();

        if (bulkMode) {
            const lines = name
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l.length > 0);

            if (!lines.length) return;

            setIsSubmitting(true);
            setError(null);

            try {
                await createSubjects(lines);
                clearInput();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
            } finally {
                setIsSubmitting(false);
            }
        } else {
            const trimmed = name.trim();
            if (!trimmed) return;

            setIsSubmitting(true);
            setError(null);

            try {
                await createSubject(trimmed);
                clearInput();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="flex w-full flex-col gap-4">
            {isAdmin && (
                <form onSubmit={handleAdd} className="flex items-end gap-2">
                    <div className="flex-1">
                        {bulkMode ? (
                            <Textarea
                                placeholder="Wklej listę przedmiotów, każdy w nowej linii..."
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (error) setError(null);
                                }}
                                disabled={isSubmitting}
                                aria-invalid={Boolean(error)}
                                className="h-24 max-h-48 min-h-24 resize-y"
                            />
                        ) : (
                            <Input
                                placeholder="Wpisz nazwę przedmiotu do dodania..."
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (error) setError(null);
                                }}
                                disabled={isSubmitting}
                                data-invalid={Boolean(error)}
                            />
                        )}
                        {error && <p className="mt-1 text-destructive text-sm">{error}</p>}
                    </div>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button type="button" variant="outline" size="icon" onClick={() => setBulkMode(!bulkMode)} disabled={isSubmitting}>
                                    <HugeiconsIcon icon={bulkMode ? SolidLine01Icon : ListViewIcon} />
                                    <span className="sr-only">{bulkMode ? "Tryb pojedynczy" : "Tryb listy"}</span>
                                </Button>
                            }
                        />
                        <TooltipContent>{bulkMode ? "Tryb pojedynczy" : "Wklej listę"}</TooltipContent>
                    </Tooltip>
                    <Button type="submit" disabled={isSubmitting || !name.trim()}>
                        {isSubmitting ? <HugeiconsIcon icon={Loading03Icon} className="animate-spin" /> : <HugeiconsIcon icon={PlusSignCircleIcon} />}
                        Dodaj
                    </Button>
                </form>
            )}
            <div className="w-full overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead>Przedmiot</TableHead>
                            <TableHead className="w-20 text-right">Podręczniki</TableHead>
                            {isAdmin && <TableHead className="w-20 text-right" />}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subjects.length ? (
                            subjects.map((subject) => (
                                <TableRow key={subject.id} className="bg-muted/10 hover:bg-muted/20">
                                    <TableCell>
                                        <span className="font-medium">{subject.name}</span>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">{subject.textbookCount}</TableCell>
                                    {isAdmin && (
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-0.5">
                                                <Tooltip>
                                                    <TooltipTrigger
                                                        render={
                                                            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(subject)}>
                                                                <HugeiconsIcon icon={Edit03Icon} />
                                                                <span className="sr-only">Edytuj</span>
                                                            </Button>
                                                        }
                                                    />
                                                    <TooltipContent>Edytuj</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger
                                                        render={
                                                            <Button variant="ghost" size="icon-sm" onClick={() => onDelete(subject)}>
                                                                <HugeiconsIcon icon={Delete02Icon} className="text-destructive" />
                                                                <span className="sr-only">Usuń</span>
                                                            </Button>
                                                        }
                                                    />
                                                    <TooltipContent>Usuń</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 3 : 2} className="h-24 text-center">
                                    Brak przedmiotów.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
