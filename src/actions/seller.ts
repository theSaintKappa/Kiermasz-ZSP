"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Nie jesteś zalogowany.");
    return supabase;
}

async function getEventId(): Promise<string> {
    const cookieStore = await cookies();
    const eventId = cookieStore.get("x-event-id")?.value;
    if (!eventId) throw new Error("Nie wybrano wydarzenia.");
    return eventId;
}

// ── Sellers ──────────────────────────────────────────────────────────────────

interface CreateSellerInput {
    firstName: string;
    lastName: string;
    classSymbol: string;
}

export async function createSeller(input: CreateSellerInput): Promise<{ id: string }> {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const classSymbol = input.classSymbol.trim();

    if (!firstName) throw new Error("Podaj imię.");
    if (!lastName) throw new Error("Podaj nazwisko.");
    if (!classSymbol) throw new Error("Podaj symbol klasy.");

    const supabase = await requireAuth();
    const eventId = await getEventId();

    const { data, error } = await supabase.from("sellers").insert({ event_id: eventId, first_name: firstName, last_name: lastName, class_symbol: classSymbol }).select("id").single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/inventory");
    return { id: data.id };
}

interface UpdateSellerInput {
    id: string;
    firstName: string;
    lastName: string;
    classSymbol: string;
}

export async function updateSeller(input: UpdateSellerInput): Promise<void> {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const classSymbol = input.classSymbol.trim();

    if (!firstName) throw new Error("Podaj imię.");
    if (!lastName) throw new Error("Podaj nazwisko.");
    if (!classSymbol) throw new Error("Podaj symbol klasy.");

    const supabase = await requireAuth();

    const { error } = await supabase.from("sellers").update({ first_name: firstName, last_name: lastName, class_symbol: classSymbol }).eq("id", input.id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/inventory");
}

export async function updateSellerNotes(id: string, notes: string): Promise<void> {
    const supabase = await requireAuth();

    const { error } = await supabase
        .from("sellers")
        .update({ notes: notes.trim() || null })
        .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/inventory");
}

export async function deleteSeller(id: string): Promise<void> {
    const supabase = await requireAuth();

    const { count } = await supabase.from("textbook_items").select("id", { count: "exact", head: true }).eq("seller_id", id);
    if (count && count > 0) {
        throw new Error("Nie można usunąć sprzedawcy, który ma przypisane podręczniki. Usuń je najpierw.");
    }

    const { error } = await supabase.from("sellers").delete().eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/inventory");
}

// ── Textbook Items ───────────────────────────────────────────────────────────

interface CreateTextbookItemInput {
    sellerId: string;
    titleId: string;
    price: number;
}

export async function createTextbookItem(input: CreateTextbookItemInput): Promise<{ id: string }> {
    if (input.price <= 0) throw new Error("Cena musi być większa od zera.");

    const supabase = await requireAuth();
    const eventId = await getEventId();

    const { data, error } = await supabase.from("textbook_items").insert({ event_id: eventId, seller_id: input.sellerId, title_id: input.titleId, price: input.price }).select("id").single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/inventory");
    return { id: data.id };
}

interface UpdateTextbookItemInput {
    id: string;
    price: number;
    notes: string | null;
}

export async function updateTextbookItem(input: UpdateTextbookItemInput): Promise<void> {
    if (input.price <= 0) throw new Error("Cena musi być większa od zera.");

    const supabase = await requireAuth();

    const { error } = await supabase
        .from("textbook_items")
        .update({ price: input.price, notes: input.notes?.trim() || null })
        .eq("id", input.id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/inventory");
}

export async function deleteTextbookItem(id: string): Promise<void> {
    const supabase = await requireAuth();

    const { count: saleCount } = await supabase.from("sale_items").select("id", { count: "exact", head: true }).eq("textbook_item_id", id);
    if (saleCount && saleCount > 0) {
        throw new Error("Nie można usunąć podręcznika, który został sprzedany. Sprzedaż musi zostać najpierw usunięta.");
    }

    const { count: reservationCount } = await supabase.from("reservation_items").select("id", { count: "exact", head: true }).eq("textbook_item_id", id);
    if (reservationCount && reservationCount > 0) {
        throw new Error("Nie można usunąć podręcznika, który jest zarezerwowany. Rezerwacja musi zostać najpierw usunięta.");
    }

    const { error } = await supabase.from("textbook_items").delete().eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/inventory");
}
