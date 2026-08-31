import type { EducationLevel } from "@/lib/textbook-utils";

export interface SalesSearchItem {
    itemId: string;
    titleId: string;
    title: string;
    subtitle: string | null;
    isbn: string;
    publisher: string | null;
    publishingYear: number | null;
    level: EducationLevel;
    subjectName: string | null;
    price: number;
    status: "available" | "reserved";
    coverPath: string | null;
}

export interface SellerGroup {
    sellerId: string;
    firstName: string;
    lastName: string;
    classSymbol: string;
    items: SalesSearchItem[];
}

export const LEVEL_SHORT_LABELS: Record<EducationLevel, string> = {
    basic: "P",
    extended: "R",
    basic_and_extended: "P+R",
};
