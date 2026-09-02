import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SellerRow, TextbookItemRow } from "../inventory-utils";
import { SellersView } from "../inventory-view";

export const metadata: Metadata = {
    title: "Sprzedawca — Panel",
};

interface SellerProfilePageProps {
    params: Promise<{ id: string }>;
}

export default async function SellerProfilePage({ params }: SellerProfilePageProps) {
    const { id } = await params;
    const supabase = await createClient();
    const cookieStore = await cookies();
    const eventId = cookieStore.get("x-event-id")?.value;

    const [{ data: seller }, { data: sellers }] = await Promise.all([
        supabase.from("sellers").select("*, textbook_items(*, textbook_titles(title, subtitle, isbn, publisher, publishing_year, cover_path, subjects(name)))").eq("id", id).order("created_at", { foreignTable: "textbook_items", ascending: false }).single(),
        eventId ? supabase.from("sellers").select("*, textbook_items(count)").eq("event_id", eventId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    ]);

    if (!seller) notFound();

    const sellerRow: SellerRow = {
        id: seller.id,
        firstName: seller.first_name,
        lastName: seller.last_name,
        classSymbol: seller.class_symbol,
        notes: seller.notes,
        createdAt: seller.created_at,
        itemCount: Array.isArray(seller.textbook_items) ? seller.textbook_items.length : 0,
    };

    // biome-ignore lint/suspicious/noExplicitAny: Supabase returns untyped join data
    const rawItems = (seller.textbook_items ?? []) as any[];
    const items: TextbookItemRow[] = rawItems.map((item) => ({
        id: item.id,
        titleId: item.title_id,
        title: item.textbook_titles?.title ?? "Nieznany",
        subtitle: item.textbook_titles?.subtitle ?? null,
        isbn: item.textbook_titles?.isbn ?? "",
        publisher: item.textbook_titles?.publisher ?? null,
        publishingYear: item.textbook_titles?.publishing_year ?? null,
        subjectName: item.textbook_titles?.subjects?.name ?? null,
        coverPath: item.textbook_titles?.cover_path ?? null,
        price: Number(item.price),
        status: item.status as TextbookItemRow["status"],
        notes: item.notes,
        createdAt: item.created_at,
    }));

    const sellerRows: SellerRow[] = (sellers ?? []).map((s) => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        classSymbol: s.class_symbol,
        notes: s.notes,
        createdAt: s.created_at,
        itemCount: s.textbook_items?.[0]?.count ?? 0,
    }));

    return <SellersView sellers={sellerRows} seller={sellerRow} items={items} eventId={eventId ?? null} />;
}
