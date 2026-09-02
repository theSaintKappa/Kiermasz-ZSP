export interface SellerRow {
    id: string;
    firstName: string;
    lastName: string;
    classSymbol: string;
    notes: string | null;
    createdAt: string;
    itemCount: number;
}

export interface TextbookItemRow {
    id: string;
    titleId: string;
    title: string;
    subtitle: string | null;
    isbn: string;
    publisher: string | null;
    publishingYear: number | null;
    subjectName: string | null;
    coverPath: string | null;
    price: number;
    status: "available" | "reserved" | "sold";
    notes: string | null;
    createdAt: string;
}

export interface TextbookTitleOption {
    id: string;
    title: string;
    subtitle: string | null;
    isbn: string;
    publisher: string | null;
    publishingYear: number | null;
    subjectName: string | null;
    coverPath: string | null;
}

export function filterSellers(sellers: SellerRow[], query: string): SellerRow[] {
    if (!query.trim()) return sellers;
    const q = query.toLowerCase().trim();
    return sellers.filter((s) => s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q) || s.classSymbol.toLowerCase().includes(q));
}

export function statusLabel(status: TextbookItemRow["status"]): string {
    switch (status) {
        case "available":
            return "Dostępny";
        case "reserved":
            return "Zarezerwowany";
        case "sold":
            return "Sprzedany";
    }
}

export function statusVariant(status: TextbookItemRow["status"]): "default" | "secondary" | "destructive" {
    switch (status) {
        case "available":
            return "default";
        case "reserved":
            return "secondary";
        case "sold":
            return "destructive";
    }
}
