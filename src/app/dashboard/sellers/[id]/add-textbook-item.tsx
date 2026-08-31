"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BarcodeIcon, BookImageIcon, Building06Icon, CalendarMortarboardIcon, Loading03Icon, PlusSignCircleIcon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { createTextbookItem } from "@/actions/seller";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTextbookSearch } from "@/hooks/use-textbook-search";
import { getCoverUrl } from "@/lib/storage-utils";
import type { TextbookTitleOption } from "../sellers-utils";

const addItemSchema = z.object({
    titleId: z.string().min(1, "Wybierz podręcznik"),
    price: z.number({ error: "Podaj cenę" }).positive("Cena musi być większa od zera"),
});

type AddItemFormValues = z.infer<typeof addItemSchema>;

interface AddTextbookItemProps {
    sellerId: string;
    onAdded?: () => void;
    onCreateTitle?: () => void;
    selectedTitleId?: string | null;
    onTitleSelect?: (id: string | null) => void;
}

export function AddTextbookItem({ sellerId, onAdded, onCreateTitle, selectedTitleId, onTitleSelect }: AddTextbookItemProps) {
    const [serverError, setServerError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedTitle, setSelectedTitle] = useState<TextbookTitleOption | null>(null);
    const priceInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { results, isLoading } = useTextbookSearch(search);

    const {
        control,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AddItemFormValues>({
        resolver: zodResolver(addItemSchema),
        defaultValues: { titleId: "", price: undefined },
    });

    // Handle external title selection (e.g. from CreateTitleDialog)
    useEffect(() => {
        if (selectedTitleId) {
            setValue("titleId", selectedTitleId);
            onTitleSelect?.(null);
            setTimeout(() => priceInputRef.current?.focus(), 50);
        }
    }, [selectedTitleId, setValue, onTitleSelect]);

    // Barcode scanner auto-select: exact ISBN match
    useEffect(() => {
        if (!search || results.length === 0) return;
        const trimmed = search.trim();
        const match = results.find((r) => r.isbn === trimmed);
        if (match) {
            setValue("titleId", match.id);
            setSelectedTitle(match);
            setOpen(false);
            setSearch("");
            setTimeout(() => priceInputRef.current?.focus(), 50);
        }
    }, [results, search, setValue]);

    const onSubmit = async (data: AddItemFormValues) => {
        setServerError(null);
        try {
            await createTextbookItem({ sellerId, titleId: data.titleId, price: data.price });
            reset();
            setSearch("");
            setSelectedTitle(null);
            onAdded?.();
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Wystąpił nieznany błąd.");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
                <div ref={containerRef} className="flex gap-2">
                    <Field data-invalid={Boolean(errors.titleId)} className="flex-1">
                        <Controller
                            name="titleId"
                            control={control}
                            render={({ field }) => (
                                <Popover
                                    open={open}
                                    onOpenChange={(v) => {
                                        setOpen(v);
                                        if (!v) setSearch("");
                                    }}
                                >
                                    <PopoverTrigger
                                        render={
                                            <button
                                                type="button"
                                                role="combobox"
                                                aria-expanded={open}
                                                className="flex h-8 w-full min-w-0 items-center justify-between rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:disabled:bg-input/80"
                                            >
                                                {selectedTitle ? <span className="truncate">{selectedTitle.title}</span> : <span className="text-muted-foreground text-xs sm:text-sm">Tytuł, przedmiot lub ISBN...</span>}
                                                <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="pointer-events-none size-4 text-muted-foreground" />
                                            </button>
                                        }
                                    />
                                    <PopoverContent anchor={containerRef} className="w-(--anchor-width) p-0" align="start">
                                        <Command filter={() => 1}>
                                            <CommandInput placeholder="np. Sztuka wyrazu 2 cz. 1" value={search} onValueChange={setSearch} />
                                            <CommandList className="max-h-96">
                                                {isLoading && search ? (
                                                    <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
                                                        <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                                                        Szukanie...
                                                    </div>
                                                ) : results.length === 0 ? (
                                                    <CommandEmpty>
                                                        <div className="flex flex-col items-center gap-2 py-2">
                                                            <p className="text-muted-foreground text-sm">Nie znaleziono podręcznika.</p>
                                                            {onCreateTitle && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setOpen(false);
                                                                        onCreateTitle();
                                                                    }}
                                                                >
                                                                    <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} />
                                                                    Dodaj nowy tytuł
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </CommandEmpty>
                                                ) : (
                                                    <CommandGroup>
                                                        {results.map((t) => {
                                                            const coverUrl = getCoverUrl(t.coverPath);
                                                            return (
                                                                <CommandItem
                                                                    key={t.id}
                                                                    value={t.id}
                                                                    onSelect={() => {
                                                                        field.onChange(t.id === field.value ? "" : t.id);
                                                                        setSelectedTitle(t.id === field.value ? null : t);
                                                                        setOpen(false);
                                                                        setSearch("");
                                                                    }}
                                                                    className="flex items-center gap-3"
                                                                >
                                                                    <div className="aspect-210/297 h-14">
                                                                        {coverUrl ? (
                                                                            <Image src={coverUrl} alt={t.title} width={64} height={88} className="size-full shrink-0 rounded object-cover" />
                                                                        ) : (
                                                                            <div className="flex size-full shrink-0 items-center justify-center rounded border border-dashed bg-muted">
                                                                                <HugeiconsIcon icon={BookImageIcon} className="size-5 text-muted-foreground/40" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="truncate text-sm">{t.title}</p>
                                                                        {t.subtitle && <p className="truncate text-muted-foreground text-xs">{t.subtitle}</p>}
                                                                        <div className="flex gap-2 overflow-hidden">
                                                                            {t.publisher && (
                                                                                <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                                                                                    <HugeiconsIcon className="size-3" icon={Building06Icon} />
                                                                                    <span>{t.publisher}</span>
                                                                                </div>
                                                                            )}
                                                                            {t.publishingYear && (
                                                                                <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                                                                                    <HugeiconsIcon className="size-3" icon={CalendarMortarboardIcon} />
                                                                                    <span>{t.publishingYear}</span>
                                                                                </div>
                                                                            )}
                                                                            {t.isbn && (
                                                                                <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                                                                                    <HugeiconsIcon className="size-3" icon={BarcodeIcon} />
                                                                                    <span>{t.isbn}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                        <FieldError errors={[errors.titleId]} />
                    </Field>

                    <Field data-invalid={Boolean(errors.price)} className="w-16">
                        <Controller
                            name="price"
                            control={control}
                            render={({ field: { value, onChange, ...field } }) => (
                                <InputGroup>
                                    <InputGroupInput
                                        {...field}
                                        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        ref={priceInputRef}
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="0"
                                        value={value ?? ""}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            onChange(v === "" ? "" : Number(v));
                                        }}
                                    />
                                    <InputGroupAddon align="inline-end">
                                        <InputGroupText>zł</InputGroupText>
                                    </InputGroupAddon>
                                </InputGroup>
                            )}
                        />
                        <FieldError errors={[errors.price]} />
                    </Field>

                    <Button type="submit" disabled={isSubmitting}>
                        <HugeiconsIcon icon={PlusSignCircleIcon} />
                        {isSubmitting ? "Dodawanie" : "Dodaj"}
                    </Button>
                </div>
                {serverError && <p className="text-destructive text-sm">{serverError}</p>}
            </FieldGroup>
        </form>
    );
}
