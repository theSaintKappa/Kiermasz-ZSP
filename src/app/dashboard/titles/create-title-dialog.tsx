"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnonymousIcon, BookImageIcon, Camera01Icon, Cancel01Icon, ImageUploadIcon, Link04Icon, Loading03Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { createSubject } from "@/actions/subject";
import { createTitle, updateTitle } from "@/actions/title";
import { Button, buttonVariants } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { textbookTitleFormSchema } from "@/lib/schemas";
import { getCoverUrl } from "@/lib/storage-utils";
import { createClient } from "@/lib/supabase/client";
import type { EducationLevel, TextbookLookupResult } from "@/lib/textbook-utils";
import { AuthorsInput } from "./authors-input";
import { useBarcodeScanner } from "./use-barcode-scanner";

type CreateTitleFormValues = z.infer<typeof textbookTitleFormSchema>;

export interface TextbookRow {
    id: string;
    isbn: string;
    title: string;
    subtitle: string | null;
    authors: string[];
    publisher: string | null;
    publishing_year: number | null;
    subject_id: string | null;
    subject_name: string | null;
    level: EducationLevel;
    cover_path: string | null;
    created_at: string;
}

const LEVEL_LABELS: Record<EducationLevel, string> = {
    basic: "Podstawowy",
    extended: "Rozszerzony",
    basic_and_extended: "Podstawowy i rozszerzony",
};

const LEVELS: EducationLevel[] = Object.keys(LEVEL_LABELS) as EducationLevel[];

const ACCEPTED_COVER_TYPES = "image/jpeg,image/png,image/webp";

interface CreateTitleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: TextbookRow | null;
    onSuccess?: () => void;
    onDelete?: () => void;
}

export function CreateTitleDialog({ open, onOpenChange, title, onSuccess, onDelete }: CreateTitleDialogProps) {
    const isEdit = !!title;
    const existingCoverUrl = isEdit ? getCoverUrl(title.cover_path) : null;
    const [serverError, setServerError] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<{ label: string; value: string }[]>([]);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [lookupResult, setLookupResult] = useState<TextbookLookupResult | null>(null);
    const [subjectOpen, setSubjectOpen] = useState(false);
    const [subjectValue, setSubjectValue] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverUrl, setCoverUrl] = useState("");
    const [coverPreview, setCoverPreview] = useState<string | null>(existingCoverUrl);
    const [coverRemoved, setCoverRemoved] = useState(false);

    const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<CreateTitleFormValues>({
        resolver: zodResolver(textbookTitleFormSchema),
        defaultValues: isEdit
            ? {
                  isbn: title.isbn,
                  title: title.title,
                  subtitle: title.subtitle ?? "",
                  authors: title.authors,
                  publisher: title.publisher ?? "",
                  publishing_year: title.publishing_year ?? undefined,
                  subject_id: title.subject_id,
                  subject_name: null,
                  level: title.level,
              }
            : { isbn: "", title: "", subtitle: "", authors: [], publisher: "", publishing_year: undefined, subject_id: null, subject_name: null, level: "basic" },
    });

    const watchIsbn = form.watch("isbn");
    const watchSubjectId = form.watch("subject_id");
    const watchSubjectName = form.watch("subject_name");

    const scanner = useBarcodeScanner({
        onScan: (isbn) => {
            form.setValue("isbn", isbn);
            lookupIsbn(isbn);
        },
    });

    const fetchSubjects = async () => {
        const supabase = createClient();
        const { data } = await supabase.from("subjects").select("id, name").order("name");
        if (data) setSubjects(data.map((s) => ({ label: s.name, value: s.id })));
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: fetchSubjects is stable and we only want to call it when dialog opens
    useEffect(() => {
        if (open) fetchSubjects();
    }, [open]);

    useEffect(() => {
        if (!subjectOpen) {
            if (watchSubjectId) {
                const s = subjects.find((s) => s.value === watchSubjectId);
                if (s) setSubjectValue(s.label);
            } else if (watchSubjectName) {
                setSubjectValue(watchSubjectName);
            } else {
                setSubjectValue("");
            }
        }
    }, [watchSubjectId, watchSubjectName, subjects, subjectOpen]);

    useEffect(() => {
        if (!open) return;
        if (isEdit && title) {
            form.reset({
                isbn: title.isbn,
                title: title.title,
                subtitle: title.subtitle ?? "",
                authors: title.authors,
                publisher: title.publisher ?? "",
                publishing_year: title.publishing_year ?? undefined,
                subject_id: title.subject_id,
                subject_name: null,
                level: title.level,
            });
            const cover = getCoverUrl(title.cover_path);
            setCoverPreview(cover);
            setCoverRemoved(false);
            setCoverFile(null);
            setCoverUrl("");
            setSubjectValue(title.subject_name ?? "");
            setLookupError(null);
            setLookupResult(null);
            setServerError(null);
        }
    }, [open, title, isEdit, form.reset]);

    const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (coverPreview && coverFile) URL.revokeObjectURL(coverPreview);
        setCoverFile(file);
        setCoverUrl("");
        setCoverRemoved(false);
        setCoverPreview(URL.createObjectURL(file));
    };

    const handleCoverUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value.trim();
        if (coverPreview && coverFile) URL.revokeObjectURL(coverPreview);
        setCoverFile(null);
        setCoverUrl(url);
        setCoverRemoved(false);
        setCoverPreview(url || null);
        if (coverInputRef.current) coverInputRef.current.value = "";
    };

    const handleCoverRemove = () => {
        if (coverPreview && coverFile) URL.revokeObjectURL(coverPreview);
        setCoverFile(null);
        setCoverUrl("");
        setCoverPreview(null);
        setCoverRemoved(true);
        if (coverInputRef.current) coverInputRef.current.value = "";
    };

    const resetAll = () => {
        form.reset({
            isbn: "",
            title: "",
            subtitle: "",
            authors: [],
            publisher: "",
            publishing_year: undefined,
            subject_id: null,
            subject_name: null,
            level: "basic",
        });
        setLookupLoading(false);
        setLookupError(null);
        setLookupResult(null);
        setServerError(null);
        setSubjectOpen(false);
        setSubjectValue("");
        setCoverRemoved(false);
        handleCoverRemove();
        void scanner.stop();
    };

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next);
    };

    const lookupIsbn = (isbn: string) => {
        const cleaned = isbn.replace(/[\s-]/g, "");
        if (cleaned.length !== 10 && cleaned.length !== 13) return;
        if (!/^\d+$/.test(cleaned)) return;

        if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);

        lookupTimerRef.current = setTimeout(async () => {
            setLookupLoading(true);
            setLookupError(null);
            setLookupResult(null);

            try {
                const res = await fetch(`/api/isbn-search?isbn=${encodeURIComponent(cleaned)}`);
                const data = await res.json();

                if (!res.ok) {
                    setLookupError(data.error ?? "Wystąpił błąd podczas wyszukiwania.");
                    setLookupResult(null);
                    return;
                }

                setLookupResult(data);

                form.setValue("isbn", cleaned);
                form.setValue("title", data.title);
                form.setValue("subtitle", data.subtitle ?? "");
                form.setValue("authors", data.authors);
                form.setValue("publisher", data.publisher ?? "");
                form.setValue("publishing_year", data.publication_year ?? null);
                form.setValue("level", data.education_level ?? "basic");
                form.setValue("subject_name", data.subject ?? null);
                form.setValue("subject_id", data.subject_id ?? null);
            } catch {
                setLookupError("Nie udało się połączyć z API.");
                setLookupResult(null);
            } finally {
                setLookupLoading(false);
            }
        }, 500);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: lookupIsbn is stable and we only want to call it when ISBN changes
    useEffect(() => {
        if (!watchIsbn || isEdit) return;
        lookupIsbn(watchIsbn);
    }, [watchIsbn]);

    const onSubmit = async (data: CreateTitleFormValues) => {
        setServerError(null);

        try {
            let finalSubjectId: string | null = data.subject_id ?? null;

            if (!finalSubjectId && data.subject_name) {
                const { id } = await createSubject(data.subject_name);
                finalSubjectId = id;
            }

            const formData = new FormData();

            if (isEdit && title) {
                formData.append(
                    "data",
                    JSON.stringify({
                        id: title.id,
                        data: {
                            title: data.title,
                            subtitle: data.subtitle || null,
                            authors: data.authors?.length ? data.authors : null,
                            publisher: data.publisher || null,
                            publishing_year: data.publishing_year ?? null,
                            subject_id: finalSubjectId,
                            level: data.level,
                        },
                    }),
                );
                if (coverRemoved) formData.append("cover_removed", "true");
                else if (coverFile) formData.append("cover", coverFile);
                else if (coverUrl) formData.append("cover_url", coverUrl);

                await updateTitle(formData);
            } else {
                formData.append(
                    "data",
                    JSON.stringify({
                        isbn: data.isbn,
                        title: data.title,
                        subtitle: data.subtitle || null,
                        authors: data.authors?.length ? data.authors : null,
                        publisher: data.publisher || null,
                        publishing_year: data.publishing_year ?? null,
                        subject_id: finalSubjectId,
                        level: data.level,
                    }),
                );
                if (coverFile) formData.append("cover", coverFile);
                else if (coverUrl) formData.append("cover_url", coverUrl);

                await createTitle(formData);
                resetAll();
            }

            onSuccess?.();
            handleOpenChange(false);
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="p-0 sm:max-w-lg">
                <DialogHeader className="px-4 pt-4">
                    <DialogTitle>{isEdit ? "Edytuj tytuł" : "Dodaj tytuł"}</DialogTitle>
                    <DialogDescription>{isEdit ? "Edytuj dane podręcznika." : "Wpisz numer ISBN/EAN, aby automatycznie uzupełnić dane."}</DialogDescription>
                </DialogHeader>
                <form id="create-title-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                    <FieldGroup className="no-scrollbar max-h-[60vh] overflow-y-auto px-4 pb-4 sm:max-h-[80vh]">
                        <Controller
                            name="isbn"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>ISBN</FieldLabel>
                                    <div className="relative">
                                        <div className="flex gap-2">
                                            <InputGroup>
                                                <InputGroupInput {...field} id={field.name} placeholder="np. 9788326750793" aria-invalid={fieldState.invalid} disabled={isEdit} />
                                                {!isEdit && <InputGroupAddon align="inline-end">{lookupLoading && <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />}</InputGroupAddon>}
                                            </InputGroup>
                                            {!isEdit && (
                                                <Button
                                                    type="button"
                                                    variant={scanner.open ? "default" : "outline"}
                                                    size="icon"
                                                    onClick={() => {
                                                        scanner.open ? void scanner.stop() : scanner.setOpen(true);
                                                    }}
                                                >
                                                    <HugeiconsIcon icon={Camera01Icon} />
                                                    <span className="sr-only">Skanuj kod kreskowy</span>
                                                </Button>
                                            )}
                                        </div>
                                        <scanner.Viewfinder />
                                    </div>
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    {!fieldState.invalid && scanner.error && <FieldError>{scanner.error}</FieldError>}
                                    {lookupError && <FieldError>{lookupError}</FieldError>}
                                </Field>
                            )}
                        />
                        <Controller
                            name="title"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Tytuł</FieldLabel>
                                    <Input {...field} id={field.name} placeholder="np. Odkryć fizykę 2" aria-invalid={fieldState.invalid} />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                        <Controller
                            name="subtitle"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Podtytuł</FieldLabel>
                                    <Input {...field} value={field.value ?? ""} id={field.name} placeholder="np. Podręcznik dla liceum i technikum" aria-invalid={fieldState.invalid} />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                        <Controller
                            name="authors"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Autorzy</FieldLabel>
                                    <AuthorsInput {...field} value={field.value ?? []} id={field.name} placeholder="np. Adam Kowalski, Ewa Nowak" aria-invalid={fieldState.invalid} />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                        <div className="grid grid-cols-9 gap-4">
                            <Controller
                                name="publisher"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field className="col-span-7" data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>Wydawca</FieldLabel>
                                        <Input {...field} value={field.value ?? ""} id={field.name} placeholder="np. Nowa Era" aria-invalid={fieldState.invalid} />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="publishing_year"
                                control={form.control}
                                render={({ field: { value, onChange, ...field }, fieldState }) => (
                                    <Field className="col-span-2" data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>Rok</FieldLabel>
                                        <Input
                                            {...field}
                                            id={field.name}
                                            type="number"
                                            placeholder="np. 2024"
                                            aria-invalid={fieldState.invalid}
                                            value={value ?? ""}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                onChange(v === "" ? null : Number(v));
                                            }}
                                        />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-13 gap-3">
                            <Controller
                                name="subject_id"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field className="col-span-7" data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="subject_id">Przedmiot</FieldLabel>
                                        <Popover
                                            open={subjectOpen}
                                            onOpenChange={(open) => {
                                                setSubjectOpen(open);
                                                if (!open) {
                                                    const matched = subjects.find((s) => s.label.toLowerCase() === subjectValue.toLowerCase());
                                                    if (matched) {
                                                        field.onChange(matched.value);
                                                        form.setValue("subject_name", null);
                                                    } else if (subjectValue) {
                                                        field.onChange(null);
                                                        form.setValue("subject_name", subjectValue);
                                                    } else {
                                                        field.onChange(null);
                                                        form.setValue("subject_name", null);
                                                    }
                                                }
                                            }}
                                        >
                                            <PopoverTrigger render={<Button id={field.name} variant="outline" role="combobox" aria-expanded={subjectOpen} className="w-full justify-between font-normal" aria-invalid={fieldState.invalid} />}>
                                                {subjectValue ? <span className="truncate">{subjects.find((s) => s.label.toLowerCase() === subjectValue.toLowerCase())?.label || subjectValue}</span> : <span className="text-muted-foreground">np. Fizyka</span>}
                                                <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="pointer-events-none size-4 text-muted-foreground" />
                                            </PopoverTrigger>
                                            <PopoverContent className="w-(--anchor-width) p-0" align="start">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Wyszukaj przedmiot..."
                                                        value={subjectValue}
                                                        onValueChange={(search) => {
                                                            setSubjectValue(search);
                                                        }}
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            <p>Nie znaleziono przedmiotu.</p>
                                                            <p>Zostanie utworzony jako nowy.</p>
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {subjects.map((s) => (
                                                                <CommandItem
                                                                    key={s.value}
                                                                    value={s.label}
                                                                    onSelect={(currentValue) => {
                                                                        if (currentValue === subjectValue) {
                                                                            setSubjectValue("");
                                                                            field.onChange(null);
                                                                        } else {
                                                                            setSubjectValue(currentValue);
                                                                            field.onChange(s.value);
                                                                        }
                                                                        form.setValue("subject_name", null);
                                                                        setSubjectOpen(false);
                                                                    }}
                                                                >
                                                                    {s.label}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                        {lookupResult?.subject_matched && <p className="mb-2 text-green-500 text-xs">Przedmiot został dopasowany.</p>}
                                        {lookupResult && !lookupResult.subject_matched && lookupResult.subject && <p className="text-amber-500 text-xs">Nie udało się dopasować przedmiotu.</p>}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="level"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field className="col-span-6" data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="level">Poziom nauczania</FieldLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger id={field.name} className="w-full" aria-invalid={fieldState.invalid}>
                                                <SelectValue>{(value: string) => LEVEL_LABELS[value as EducationLevel] ?? value}</SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LEVELS.map((lvl) => (
                                                    <SelectItem key={lvl} value={lvl}>
                                                        {LEVEL_LABELS[lvl]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )}
                            />
                        </div>
                        <Field>
                            <FieldLabel>Zdjęcie okładki</FieldLabel>
                            <div className="flex h-28 items-start gap-3">
                                <div className="relative h-full w-20 shrink-0">
                                    {coverPreview ? (
                                        <>
                                            {/* biome-ignore lint/performance/noImgElement: blob URL not supported by next/image */}
                                            <img src={coverPreview} alt="Podgląd okładki" className="h-full rounded-md object-cover" />
                                            <Button size="icon-xs" className="-right-1.5 -top-1.5 absolute rounded-full" onClick={handleCoverRemove}>
                                                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.5} />
                                                <span className="sr-only">Usuń okładkę</span>
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="flex size-full shrink-0 items-center justify-center rounded-md border border-dashed">
                                            <HugeiconsIcon icon={BookImageIcon} className="size-6 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex size-full flex-col justify-center gap-1.5">
                                    <InputGroup>
                                        <InputGroupInput ref={coverInputRef} type="file" accept={ACCEPTED_COVER_TYPES} onChange={handleCoverSelect} />
                                        <InputGroupAddon>
                                            <HugeiconsIcon icon={ImageUploadIcon} />
                                        </InputGroupAddon>
                                    </InputGroup>
                                    <span className="ml-2.5 text-muted-foreground text-xs">lub</span>
                                    <div className="flex gap-2">
                                        <InputGroup>
                                            <InputGroupInput type="url" placeholder="https://..." value={coverUrl} onChange={handleCoverUrlChange} />
                                            <InputGroupAddon>
                                                <HugeiconsIcon icon={Link04Icon} />
                                            </InputGroupAddon>
                                        </InputGroup>
                                        <Tooltip>
                                            {textbookTitleFormSchema.shape.isbn.safeParse(watchIsbn).success && (
                                                <TooltipTrigger
                                                    render={
                                                        <a href={`https://www.taniaksiazka.pl/Search?q=${form.getValues("isbn")}`} className={buttonVariants({ variant: "outline", size: "icon" })} target="_blank" rel="noopener noreferrer">
                                                            <HugeiconsIcon icon={AnonymousIcon} />
                                                            <span className="sr-only">Ukradnij zdjęcie okładki</span>
                                                        </a>
                                                    }
                                                />
                                            )}
                                            <TooltipContent>
                                                <p>Ukradnij zdjęcie okładki</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        </Field>
                        {serverError && <FieldError>{serverError}</FieldError>}
                    </FieldGroup>
                    <DialogFooter className="mx-0 mb-0">
                        {!isEdit && (
                            <Button type="button" variant="ghost" className="sm:mr-auto" onClick={resetAll}>
                                Wyczyść
                            </Button>
                        )}
                        {isEdit && (
                            <Button
                                type="button"
                                variant="destructive"
                                className="sm:mr-auto"
                                onClick={() => {
                                    handleOpenChange(false);
                                    onDelete?.();
                                }}
                            >
                                Usuń
                            </Button>
                        )}
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                            Anuluj
                        </Button>
                        <Button type="submit" form="create-title-form" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Zapisywanie..." : isEdit ? "Zapisz zmiany" : "Zapisz"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
