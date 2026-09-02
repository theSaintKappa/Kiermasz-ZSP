"use client";

import { ArrowLeft02Icon, BarcodeIcon, BookImageIcon, Building06Icon, CalendarMortarboardIcon, Delete02Icon, Edit02Icon, Note05Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateSellerNotes } from "@/actions/seller";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/format-utils";
import { getCoverUrl } from "@/lib/storage-utils";
import { useSetBreadcrumbLabel } from "../../breadcrumb-nav";
import { CreateTitleDialog } from "../../titles/create-title-dialog";
import { type SellerRow, statusLabel, statusVariant, type TextbookItemRow } from "../inventory-utils";
import { AddTextbookItem } from "./add-textbook-item";
import { ConfirmDeleteSellerDialog } from "./confirm-delete-seller-dialog";
import { ConfirmDeleteTextbookItemDialog } from "./confirm-delete-textbook-item-dialog";
import { EditSellerDialog } from "./edit-seller-dialog";
import { EditTextbookItemDialog } from "./edit-textbook-item-dialog";

interface SellerProfileProps {
    seller: SellerRow;
    items: TextbookItemRow[];
    showBackButton?: boolean;
}

export function SellerProfile({ seller, items, showBackButton }: SellerProfileProps) {
    const router = useRouter();
    const setLabel = useSetBreadcrumbLabel();
    const [notes, setNotes] = useState(seller.notes ?? "");
    const [notesSaving, setNotesSaving] = useState(false);
    const [editSellerOpen, setEditSellerOpen] = useState(false);
    const [deleteSellerOpen, setDeleteSellerOpen] = useState(false);
    const [editItem, setEditItem] = useState<TextbookItemRow | null>(null);
    const [deleteItem, setDeleteItem] = useState<TextbookItemRow | null>(null);
    const [createTitleOpen, setCreateTitleOpen] = useState(false);
    const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);

    useEffect(() => {
        setLabel(seller.id, `${seller.firstName} ${seller.lastName}`);
    }, [seller, setLabel]);

    useEffect(() => {
        setNotes(seller.notes ?? "");
    }, [seller.notes]);

    const handleNotesBlur = async () => {
        if (notes === (seller.notes ?? "")) return;
        setNotesSaving(true);
        try {
            await updateSellerNotes(seller.id, notes);
            toast.success("Notatki zapisane");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Nie udało się zapisać notatek");
            setNotes(seller.notes ?? "");
        } finally {
            setNotesSaving(false);
        }
    };

    const initials = `${seller.firstName[0] ?? ""}${seller.lastName[0] ?? ""}`.toUpperCase();

    return (
        <div className="flex flex-col gap-4">
            {showBackButton && (
                <Button variant="link" className="w-fit p-0" nativeButton={false} render={<Link href="/dashboard/inventory" />}>
                    <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} />
                    Wróć do listy
                </Button>
            )}

            {/* Seller info */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Avatar size="lg">
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-xl">
                            {seller.firstName} {seller.lastName}
                        </h2>
                        <p className="text-muted-foreground">{seller.classSymbol}</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <Tooltip>
                        <TooltipTrigger render={<Button variant="outline" size="icon-xs" onClick={() => setEditSellerOpen(true)} />}>
                            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Edytuj profil</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger render={<Button variant="destructive" size="icon-xs" onClick={() => setDeleteSellerOpen(true)} />}>
                            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Usuń profil</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
                <InputGroup className={notes ? "" : "border-dashed"}>
                    <InputGroupTextarea rows={1} className="field-sizing-content max-h-48 min-h-8 resize-none overflow-hidden" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={handleNotesBlur} disabled={notesSaving} placeholder="Dodaj notatki..." />
                    <InputGroupAddon>
                        <HugeiconsIcon icon={Note05Icon} />
                    </InputGroupAddon>
                </InputGroup>
            </div>

            <Separator />

            {/* Add textbook */}
            <div>
                <h3 className="mb-3 font-medium text-sm">Dodaj podręcznik</h3>
                <AddTextbookItem sellerId={seller.id} onCreateTitle={() => setCreateTitleOpen(true)} selectedTitleId={selectedTitleId} onTitleSelect={setSelectedTitleId} />
            </div>

            {/* Textbook items list */}
            <div className="min-w-0">
                {items.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Brak przypisanych podręczników.</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {items.map((item) => {
                            const coverUrl = getCoverUrl(item.coverPath);
                            return (
                                <div key={item.id} className="flex items-center gap-3 overflow-hidden rounded-md border px-3 py-2">
                                    <div className="aspect-210/297 h-14">
                                        {/* {coverUrl ? <Image src={coverUrl} alt={item.title} width={64} height={88} className="h-14 w-auto shrink-0 rounded object-cover" /> : <div className="flex h-11 w-8 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground text-xs">?</div>} */}
                                        {coverUrl ? (
                                            <Image src={coverUrl} alt={item.title} width={64} height={88} className="size-full shrink-0 rounded object-cover" />
                                        ) : (
                                            <div className="flex size-full shrink-0 items-center justify-center rounded border border-dashed bg-muted">
                                                <HugeiconsIcon icon={BookImageIcon} className="size-5 text-muted-foreground/40" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-sm">{item.title}</span>
                                            <Badge variant={statusVariant(item.status)} className="shrink-0 text-xs">
                                                {statusLabel(item.status)}
                                            </Badge>
                                        </div>
                                        {item.subtitle && <p className="truncate text-muted-foreground text-xs">{item.subtitle}</p>}
                                        <div className="flex gap-2 overflow-hidden">
                                            {item.publisher && (
                                                <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                                                    <HugeiconsIcon className="size-3" icon={Building06Icon} />
                                                    <span>{item.publisher}</span>
                                                </div>
                                            )}
                                            {item.publishingYear && (
                                                <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                                                    <HugeiconsIcon className="size-3" icon={CalendarMortarboardIcon} />
                                                    <span>{item.publishingYear}</span>
                                                </div>
                                            )}
                                            {item.isbn && (
                                                <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                                                    <HugeiconsIcon className="size-3" icon={BarcodeIcon} />
                                                    <span>{item.isbn}</span>
                                                </div>
                                            )}
                                            {item.notes && (
                                                <div className="flex items-center gap-1 overflow-hidden truncate text-xs">
                                                    <HugeiconsIcon className="size-3 shrink-0" icon={Note05Icon} />
                                                    <p className="truncate">{item.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-3 flex items-center gap-2">
                                        <span className="shrink-0 font-medium text-base">{formatPrice(item.price)}</span>
                                        <div className="flex flex-col gap-1 sm:flex-row">
                                            <Tooltip>
                                                <TooltipTrigger render={<Button variant="outline" size="icon-xs" onClick={() => setEditItem(item)} />}>
                                                    <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Edytuj podręcznik</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger render={<Button variant="destructive" size="icon-xs" onClick={() => setDeleteItem(item)} />}>
                                                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Usuń podręcznik</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <EditSellerDialog open={editSellerOpen} onOpenChange={setEditSellerOpen} seller={seller} />
            <ConfirmDeleteSellerDialog open={deleteSellerOpen} onOpenChange={setDeleteSellerOpen} seller={seller} onDeleted={() => router.push("/dashboard/inventory")} />
            <EditTextbookItemDialog
                open={!!editItem}
                onOpenChange={(open) => {
                    if (!open) setEditItem(null);
                }}
                item={editItem}
            />
            <ConfirmDeleteTextbookItemDialog
                open={!!deleteItem}
                onOpenChange={(open) => {
                    if (!open) setDeleteItem(null);
                }}
                item={deleteItem}
            />
            <CreateTitleDialog
                open={createTitleOpen}
                onOpenChange={setCreateTitleOpen}
                onSuccess={(id) => {
                    if (id) {
                        setSelectedTitleId(id);
                        router.refresh();
                    }
                }}
            />
        </div>
    );
}
