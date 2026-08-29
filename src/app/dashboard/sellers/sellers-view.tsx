"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { createClient } from "@/lib/supabase/client";
import { SellerProfile } from "./[id]/seller-profile";
import { CreateSellerDialog } from "./create-seller-dialog";
import { SellersList } from "./sellers-list";
import type { SellerRow, TextbookItemRow } from "./sellers-utils";

interface SellersViewProps {
    sellers: SellerRow[];
    seller: SellerRow | null;
    items: TextbookItemRow[];
    eventId: string | null;
}

export function SellersView({ sellers, seller, items, eventId }: SellersViewProps) {
    const router = useRouter();
    const isMobile = useIsMobile(1024);
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel("sellers-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "sellers", filter: `event_id=eq.${eventId}` }, () => router.refresh())
            .on("postgres_changes", { event: "*", schema: "public", table: "textbook_items", filter: `event_id=eq.${eventId}` }, () => router.refresh())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router, eventId]);

    if (isMobile) {
        if (seller) {
            return (
                <div className="w-full min-w-0">
                    <SellerProfile seller={seller} items={items} showBackButton />
                </div>
            );
        }
        return (
            <div className="w-full min-w-0">
                <SellersList sellers={sellers} onAddClick={() => setCreateOpen(true)} activeSellerId={null} />
                <CreateSellerDialog open={createOpen} onOpenChange={setCreateOpen} />
            </div>
        );
    }

    return (
        <div className="flex w-full min-w-0 gap-4">
            <div className="min-w-60">
                <SellersList sellers={sellers} onAddClick={() => setCreateOpen(true)} activeSellerId={seller?.id ?? null} />
            </div>
            <Separator orientation="vertical" className="h-full" />
            <div className="min-w-0 flex-1">{seller ? <SellerProfile seller={seller} items={items} /> : <EmptyState />}</div>
            <CreateSellerDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Wybierz sprzedawcę z listy</p>
        </div>
    );
}
