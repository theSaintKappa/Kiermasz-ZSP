import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPageTitle } from "../nav-config";
import { buildSellerFilter, PAGE_SIZE, type PayoutItemRow, type PayoutSellerRow, type PayoutSummary } from "./payouts-utils";
import { PayoutsView } from "./payouts-view";

export const metadata: Metadata = {
    title: getPageTitle("payouts"),
};

const SELLER_SELECT = `
    id, first_name, last_name, class_symbol,
    payouts(id, amount, returned_count, paid_at, receipt_number, admin:profiles(first_name, last_name)),
    textbook_items(
        id, price, status,
        textbook_titles(title, subtitle, isbn, publisher, publishing_year, level, cover_path, subject:subjects(name)),
        sale_items(actual_price:price)
    )
`;

interface PayoutsPageProps {
    searchParams: Promise<{
        page?: string;
        q?: string;
        unpaid?: string;
    }>;
}

export default async function PayoutsPage({ searchParams }: PayoutsPageProps) {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const eventId = cookieStore.get("x-event-id")?.value ?? null;

    const params = await searchParams;
    const query = (params.q ?? "").trim();
    const page = Math.max(0, parseInt(params.page ?? "0", 10) || 0);
    const unpaid = params.unpaid === "1";

    if (!eventId) {
        return <PayoutsView sellers={[]} totalCount={0} page={0} query="" unpaid={false} summary={null} />;
    }

    // biome-ignore lint/suspicious/noExplicitAny: Supabase nested select returns loosely typed rows
    const mapSeller = (raw: any): PayoutSellerRow => {
        const payoutRaw = raw.payouts ?? null;
        const payout = payoutRaw
            ? {
                  id: payoutRaw.id as string,
                  amount: payoutRaw.amount as number,
                  returnedCount: payoutRaw.returned_count as number,
                  paidAt: payoutRaw.paid_at as string,
                  receiptNumber: payoutRaw.receipt_number as number,
                  adminName: [payoutRaw.admin?.first_name, payoutRaw.admin?.last_name].filter(Boolean).join(" ") || null,
              }
            : null;

        // biome-ignore lint/suspicious/noExplicitAny: Supabase nested select returns loosely typed rows
        const items: PayoutItemRow[] = (raw.textbook_items ?? []).map((item: any) => {
            const tt = item.textbook_titles;
            return {
                itemId: item.id as string,
                title: (tt?.title as string) ?? "Nieznany",
                subtitle: (tt?.subtitle as string) ?? null,
                isbn: (tt?.isbn as string) ?? "",
                publisher: (tt?.publisher as string) ?? null,
                publishingYear: (tt?.publishing_year as number) ?? null,
                level: (tt?.level as PayoutItemRow["level"]) ?? "basic",
                subjectName: (tt?.subject?.name as string) ?? null,
                coverPath: (tt?.cover_path as string) ?? null,
                listPrice: item.price as number,
                soldPrice: (item.sale_items?.[0]?.actual_price as number) ?? 0,
                status: item.status as PayoutItemRow["status"],
            };
        });

        const soldItems: PayoutItemRow[] = [];
        const unsoldItems: PayoutItemRow[] = [];

        for (const item of items) {
            if (item.status === "sold") {
                soldItems.push(item);
            } else {
                unsoldItems.push(item);
            }
        }

        soldItems.sort((a, b) => a.title.localeCompare(b.title, "pl"));
        unsoldItems.sort((a, b) => a.title.localeCompare(b.title, "pl"));

        const owedTotal = soldItems.reduce((sum, i) => sum + (i.soldPrice ?? 0), 0);

        return {
            sellerId: raw.id as string,
            firstName: raw.first_name as string,
            lastName: raw.last_name as string,
            classSymbol: raw.class_symbol as string,
            soldItems,
            unsoldItems,
            owedTotal,
            toReturnCount: unsoldItems.length,
            payout,
        };
    };

    const nameFilter = query ? buildSellerFilter(query) : null;

    // Summary
    const summaryPromise = supabase.rpc("payout_summary", { p_event_id: eventId }).then(({ data }) => (data as PayoutSummary) ?? null);

    // Fetch paid seller ids for the unpaid filter — embedded filters narrow the
    // nested payload only, not the parent rows, so we exclude via top-level not.in.
    let excludedSellerIds: string[] = [];
    if (unpaid) {
        const { data: paidRows } = await supabase.from("payouts").select("seller_id").eq("event_id", eventId);
        excludedSellerIds = (paidRows ?? []).map((r) => r.seller_id);
    }

    // Build rows query
    // biome-ignore lint/suspicious/noExplicitAny: PostgREST filter builder
    let rowsQ: any = supabase.from("sellers").select(SELLER_SELECT).eq("event_id", eventId);

    if (nameFilter) {
        rowsQ = rowsQ.or(nameFilter);
    }
    if (excludedSellerIds.length > 0) {
        rowsQ = rowsQ.not("id", "in", `(${excludedSellerIds.join(",")})`);
    }

    rowsQ = rowsQ
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    // Count query
    // biome-ignore lint/suspicious/noExplicitAny: PostgREST filter builder
    let countQ: any = supabase.from("sellers").select("id", { count: "exact", head: true }).eq("event_id", eventId);
    if (nameFilter) {
        countQ = countQ.or(nameFilter);
    }
    if (excludedSellerIds.length > 0) {
        countQ = countQ.not("id", "in", `(${excludedSellerIds.join(",")})`);
    }

    const [{ data: rawSellers }, { count }, summary] = await Promise.all([rowsQ, countQ, summaryPromise]);

    const total = count ?? 0;

    // Clamp page if stale
    if (page > 0 && page * PAGE_SIZE >= total) {
        const clampedPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
        const clampedFrom = clampedPage * PAGE_SIZE;
        const clampedTo = clampedFrom + PAGE_SIZE - 1;

        // biome-ignore lint/suspicious/noExplicitAny: PostgREST filter builder
        let clampedQ: any = supabase.from("sellers").select(SELLER_SELECT).eq("event_id", eventId);
        if (nameFilter) clampedQ = clampedQ.or(nameFilter);
        if (excludedSellerIds.length > 0) clampedQ = clampedQ.not("id", "in", `(${excludedSellerIds.join(",")})`);
        clampedQ = clampedQ.order("last_name", { ascending: true }).order("first_name", { ascending: true }).range(clampedFrom, clampedTo);

        const { data: clampedSellers } = await clampedQ;
        const sellers = (clampedSellers ?? []).map(mapSeller);
        return <PayoutsView sellers={sellers} totalCount={total} page={clampedPage} query={query} unpaid={unpaid} summary={summary} />;
    }

    const sellers = (rawSellers ?? []).map(mapSeller);
    return <PayoutsView sellers={sellers} totalCount={total} page={page} query={query} unpaid={unpaid} summary={summary} />;
}
