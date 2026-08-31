import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import type { EducationLevel } from "@/lib/textbook-utils";

export interface ReservationItemRow {
    itemId: string;
    price: number;
    title: string;
    subtitle: string | null;
    isbn: string;
    publisher: string | null;
    publishingYear: number | null;
    level: EducationLevel;
    subjectName: string | null;
    coverPath: string | null;
    sellerId: string;
    sellerFirstName: string;
    sellerLastName: string;
    classSymbol: string;
}

export interface ReservationRow {
    id: string;
    firstName: string;
    lastName: string;
    reservationNumber: string;
    expiresAt: string;
    createdAt: string;
    items: ReservationItemRow[];
    total: number;
}

export function isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
}

export function expiryDayKey(expiresAt: string): string {
    return format(parseISO(expiresAt), "yyyy-MM-dd");
}

export function expiryDayLabel(expiresAt: string): string {
    const date = parseISO(expiresAt);
    const formatted = format(date, "d MMMM yyyy", { locale: pl });
    if (isToday(date)) return `Dziś (${formatted})`;
    if (isTomorrow(date)) return `Jutro (${formatted})`;
    return formatted;
}

export function reservationCountLabel(n: number): string {
    if (n === 1) return "rezerwacja";
    const lastTwo = n % 100;
    const lastOne = n % 10;
    if (lastTwo >= 12 && lastTwo <= 14) return "rezerwacji";
    if (lastOne >= 2 && lastOne <= 4) return "rezerwacje";
    return "rezerwacji";
}

export const LEVEL_SHORT_LABELS: Record<EducationLevel, string> = {
    basic: "P",
    extended: "R",
    basic_and_extended: "P+R",
};
