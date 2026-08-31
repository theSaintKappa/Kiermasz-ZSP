"use client";

import { BookImageIcon, Edit03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCoverUrl } from "@/lib/storage-utils";
import { cn } from "@/lib/utils";
import type { TextbookRow } from "./create-title-dialog";

const LEVEL_LABELS: Record<string, string> = {
    basic: "Podstawowy",
    extended: "Rozszerzony",
    basic_and_extended: "Podstawowy i rozszerzony",
};

interface TextbookCardProps {
    textbook: TextbookRow;
    onEdit: (textbook: TextbookRow) => void;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("pl-PL", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function TextbookCard({ textbook, onEdit }: TextbookCardProps) {
    const authorsText = textbook.authors?.length ? textbook.authors.join(", ") : null;
    const coverUrl = getCoverUrl(textbook.cover_path);

    return (
        <div className="group/card relative flex flex-col rounded-xl border bg-card transition-shadow hover:shadow-lg">
            <div className="relative aspect-210/297 overflow-hidden rounded-t-xl bg-muted/50">
                {coverUrl ? (
                    <Image
                        src={coverUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 20vw, 16vw"
                        className="object-cover brightness-50 sm:brightness-100 sm:transition-all sm:duration-300 sm:group-hover/card:scale-105 sm:group-hover/card:blur-[2px] sm:group-hover/card:brightness-50"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <HugeiconsIcon icon={BookImageIcon} className="size-10 text-muted-foreground/40" />
                    </div>
                )}
                <div className="opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-300 sm:group-hover/card:opacity-100">
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/60 via-black/10 to-transparent p-3">
                        <Badge variant="secondary" className="absolute top-2 left-2 text-[10px]">
                            {LEVEL_LABELS[textbook.level] ?? textbook.level}
                        </Badge>
                        <div className="flex items-center gap-1 text-white text-xs">
                            <div className="text-[10px] text-white/80 uppercase tracking-wider">ISBN</div>
                            <div>{textbook.isbn}</div>
                        </div>
                        {authorsText && (
                            <div className="mt-1.5 space-y-0.5 text-white text-xs">
                                <div className="text-[10px] text-white/80 uppercase tracking-wider">Autorzy</div>
                                <div className="line-clamp-2">{authorsText}</div>
                            </div>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-white text-xs">
                            {textbook.publisher && (
                                <div>
                                    <span className="text-[10px] text-white/80 uppercase tracking-wider">Wydawca: </span>
                                    {textbook.publisher}
                                </div>
                            )}
                            {textbook.publishing_year && (
                                <div>
                                    <span className="text-[10px] text-white/80 uppercase tracking-wider">Rok: </span>
                                    {textbook.publishing_year}
                                </div>
                            )}
                        </div>
                        <div className="mt-1.5 text-[10px] text-white/70">{formatDate(textbook.created_at)}</div>
                    </div>
                    <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2" onClick={() => onEdit(textbook)}>
                        <HugeiconsIcon icon={Edit03Icon} />
                        <span className="sr-only">Edytuj</span>
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                <span className={cn("font-medium text-sm leading-snug", !textbook.subtitle && "line-clamp-2")}>{textbook.title}</span>
                {textbook.subtitle && <span className="line-clamp-2 text-muted-foreground text-xs leading-snug">{textbook.subtitle}</span>}
            </div>
        </div>
    );
}
