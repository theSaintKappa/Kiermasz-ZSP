import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPageTitle } from "../nav-config";
import type { SellerRow, TextbookTitleOption } from "./sellers-utils";
import { SellersView } from "./sellers-view";

export const metadata: Metadata = {
    title: getPageTitle("sellers"),
};

export default async function SellersPage() {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const eventId = cookieStore.get("x-event-id")?.value;

    const [{ data: sellers }, { data: titles }] = await Promise.all([
        eventId ? supabase.from("sellers").select("*, textbook_items(count)").eq("event_id", eventId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
        supabase.from("textbook_titles").select("id, title, subtitle, isbn, publisher, publishing_year, cover_path, subjects(name)").order("title"),
    ]);

    const sellerRows: SellerRow[] = (sellers ?? []).map((s) => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        classSymbol: s.class_symbol,
        notes: s.notes,
        createdAt: s.created_at,
        itemCount: s.textbook_items?.[0]?.count ?? 0,
    }));

    const textbookTitles: TextbookTitleOption[] = (titles ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.subtitle,
        isbn: t.isbn,
        publisher: t.publisher,
        publishingYear: t.publishing_year,
        subjectName: (t.subjects as unknown as { name: string } | null)?.name ?? null,
        coverPath: t.cover_path,
    }));

    return <SellersView sellers={sellerRows} seller={null} items={[]} textbookTitles={textbookTitles} eventId={eventId ?? null} />;
}
