import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPageTitle } from "../nav-config";
import type { SellerRow } from "./sellers-utils";
import { SellersView } from "./sellers-view";

export const metadata: Metadata = {
    title: getPageTitle("sellers"),
};

export default async function SellersPage() {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const eventId = cookieStore.get("x-event-id")?.value;

    const { data: sellers } = eventId ? await supabase.from("sellers").select("*, textbook_items(count)").eq("event_id", eventId).order("created_at", { ascending: false }) : { data: [] };

    const sellerRows: SellerRow[] = (sellers ?? []).map((s) => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        classSymbol: s.class_symbol,
        notes: s.notes,
        createdAt: s.created_at,
        itemCount: s.textbook_items?.[0]?.count ?? 0,
    }));

    return <SellersView sellers={sellerRows} seller={null} items={[]} eventId={eventId ?? null} />;
}
