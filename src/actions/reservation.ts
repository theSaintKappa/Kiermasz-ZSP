"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Nie jesteś zalogowany.");
    return supabase;
}

interface FulfillResult {
    success: boolean;
    reason?: string;
    reservationNumber?: string;
}

export async function fulfillReservation(id: string): Promise<void> {
    const supabase = await requireAuth();

    const { data, error } = await supabase.rpc("fulfill_reservation", { p_reservation_id: id });
    if (error) throw new Error(error.message);

    const result = data as FulfillResult;
    if (!result.success) {
        switch (result.reason) {
            case "cancelled":
                throw new Error("Ta rezerwacja została anulowana.");
            case "already_fulfilled":
                throw new Error("Ta rezerwacja została już zrealizowana.");
            case "items_unavailable":
                throw new Error("Niektóre podręczniki są już niedostępne.");
            default:
                throw new Error("Nie znaleziono rezerwacji.");
        }
    }

    revalidatePath("/dashboard/reservations");
}

export async function cancelReservation(id: string): Promise<void> {
    const supabase = await requireAuth();

    const { data, error } = await supabase.from("reservations").update({ cancelled_at: new Date().toISOString() }).eq("id", id).is("cancelled_at", null).is("fulfilled_at", null).select("id");

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Ta rezerwacja została już przetworzona.");

    revalidatePath("/dashboard/reservations");
}
