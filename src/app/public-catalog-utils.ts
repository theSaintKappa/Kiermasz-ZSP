export interface PublicCatalogItem {
    price: number;
    createdAt: string;
    sellerFirstName: string;
    sellerClassSymbol: string;
}

export interface PublicCatalogRow {
    id: string;
    title: string;
    subtitle: string | null;
    isbn: string;
    publisher: string | null;
    publishingYear: number | null;
    authors: string[] | null;
    level: string;
    coverPath: string | null;
    subjectName: string | null;
    availableCount: number;
    soldCount: number;
    priceFrom: number | null;
    priceTo: number | null;
    priceAvg: number | null;
    lastSoldAt: string | null;
    recentSoldCount: number;
    items: PublicCatalogItem[];
}

export const LEVEL_LABELS: Record<string, string> = {
    basic: "Podstawowy",
    extended: "Rozszerzony",
    basic_and_extended: "Podstawowy i rozszerzony",
};

export function pluralize(n: number, one: string, few: string, many: string): string {
    if (n === 1) return one;
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
    return many;
}

export function formatDayDate(iso: string): string {
    return new Date(iso).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Warsaw",
    });
}

const HOT_RECENT_SOLD = 6;
const HOT_SOLD_OUT_MIN = 20;
const HOT_SELLTHROUGH_MIN_SOLD = 25;
const HOT_SELLTHROUGH_RATIO = 0.9;

export function isHotTitle(row: PublicCatalogRow): boolean {
    if (row.recentSoldCount >= HOT_RECENT_SOLD) return true;
    if (row.availableCount === 0 && row.soldCount >= HOT_SOLD_OUT_MIN) return true;
    const total = row.soldCount + row.availableCount;
    return row.soldCount >= HOT_SELLTHROUGH_MIN_SOLD && total > 0 && row.soldCount / total >= HOT_SELLTHROUGH_RATIO;
}
