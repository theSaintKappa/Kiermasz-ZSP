import type { EducationLevel } from "@/lib/textbook-utils";

export const PAGE_SIZE = 10;

export interface PayoutItemRow {
    itemId: string;
    title: string;
    subtitle: string | null;
    isbn: string;
    publisher: string | null;
    publishingYear: number | null;
    level: EducationLevel;
    subjectName: string | null;
    coverPath: string | null;
    listPrice: number;
    soldPrice: number | null;
    status: "available" | "reserved" | "sold";
}

export interface PayoutSellerRow {
    sellerId: string;
    firstName: string;
    lastName: string;
    classSymbol: string;
    soldItems: PayoutItemRow[];
    unsoldItems: PayoutItemRow[];
    owedTotal: number;
    toReturnCount: number;
    payout: { id: string; amount: number; returnedCount: number; paidAt: string } | null;
}

export interface PayoutSummary {
    sellersTotal: number;
    sellersPaid: number;
    paidTotal: number;
    owedTotal: number;
    booksToReturn: number;
}

export function sellerCountLabel(n: number): string {
    if (n === 1) return "sprzedawca";
    return "sprzedawców";
}

export function textbookCountLabel(n: number): string {
    if (n === 1) return "podręcznik";
    if (n < 5) return "podręczniki";
    return "podręczników";
}

export function textbookReturnCountLabel(n: number): string {
    if (n === 1) return "zwrócony";
    if (n < 5) return "zwrócone";
    return "zwróconych";
}

export function payoutFilterValue(raw: string): string {
    return raw
        .replace(/[,()%]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function buildSellerFilter(query: string): string | null {
    const tokens = query
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map((t) => payoutFilterValue(t))
        .filter(Boolean);

    if (tokens.length === 0) return null;

    const parts: string[] = [];
    for (const tok of tokens) {
        parts.push(`last_name.ilike.%${tok}%`);
        parts.push(`first_name.ilike.%${tok}%`);
        parts.push(`class_symbol.ilike.%${tok}%`);
    }
    return parts.join(",");
}
