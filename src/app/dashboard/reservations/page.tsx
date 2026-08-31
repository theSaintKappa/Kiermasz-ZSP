import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPageTitle } from "../nav-config";
import type { ReservationItemRow, ReservationRow } from "./reservations-utils";
import { ReservationsView } from "./reservations-view";

export const metadata: Metadata = { title: getPageTitle("reservations") };

export default async function ReservationsPage() {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const eventId = cookieStore.get("x-event-id")?.value;

    if (!eventId) return <ReservationsView reservations={[]} />;

    const { data: raw } = await supabase
        .from("reservations")
        .select(
            `id, first_name, last_name, reservation_number, expires_at, created_at,
             items:reservation_items(
               textbook_item:textbook_items(
                 id, price,
                 title:textbook_titles(title, subtitle, isbn, publisher, publishing_year, level, cover_path, subject:subjects(name)),
                 seller:sellers(id, first_name, last_name, class_symbol)
               )
             )`,
        )
        .eq("event_id", eventId)
        .is("cancelled_at", null)
        .is("fulfilled_at", null)
        .order("expires_at", { ascending: true });

    const reservations: ReservationRow[] = (raw ?? []).map((r) => {
        // biome-ignore lint/suspicious/noExplicitAny: Supabase nested select returns loosely typed rows
        const items: ReservationItemRow[] = (r.items ?? []).map((ri: any) => {
            const ti = ri.textbook_item;
            const tt = ti?.title;
            const seller = ti?.seller;
            return {
                itemId: ti?.id ?? "",
                price: ti?.price ?? 0,
                title: tt?.title ?? "",
                subtitle: tt?.subtitle ?? null,
                isbn: tt?.isbn ?? "",
                publisher: tt?.publisher ?? null,
                publishingYear: tt?.publishing_year ?? null,
                level: tt?.level ?? "basic",
                subjectName: tt?.subject?.name ?? null,
                coverPath: tt?.cover_path ?? null,
                sellerId: seller?.id ?? "",
                sellerFirstName: seller?.first_name ?? "",
                sellerLastName: seller?.last_name ?? "",
                classSymbol: seller?.class_symbol ?? "",
            };
        });
        return {
            id: r.id,
            firstName: r.first_name,
            lastName: r.last_name,
            reservationNumber: r.reservation_number,
            expiresAt: r.expires_at,
            createdAt: r.created_at,
            items,
            total: items.reduce((sum, i) => sum + i.price, 0),
        };
    });

    return <ReservationsView reservations={reservations} />;
}
