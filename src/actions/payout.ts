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

export interface ConfirmedPayout {
    id: string;
    amount: number;
    returnedCount: number;
    paidAt: string;
    receiptNumber: number;
}

export async function confirmPayout(sellerId: string): Promise<ConfirmedPayout> {
    const supabase = await requireAuth();
    const eventId = await getEventId();

    const { data, error } = await supabase.rpc("confirm_payout", {
        p_event_id: eventId,
        p_seller_id: sellerId,
    });

    if (error) throw new Error(error.message);

    const result = data as {
        success: boolean;
        reason?: string;
        amount?: number;
        returnedCount?: number;
        payoutId?: string;
        paidAt?: string;
        receiptNumber?: number;
    };

    if (!result.success) {
        switch (result.reason) {
            case "forbidden":
                throw new Error("Tylko super administrator może potwierdzać wypłaty.");
            case "already_paid":
                throw new Error("Ten sprzedawca został już wypłacony.");
            case "not_found":
                throw new Error("Nie znaleziono sprzedawcy.");
            default:
                throw new Error("Nie udało się potwierdzić wypłaty.");
        }
    }

    revalidatePath("/dashboard/payouts");
    return {
        id: result.payoutId ?? "",
        amount: result.amount ?? 0,
        returnedCount: result.returnedCount ?? 0,
        paidAt: result.paidAt ?? "",
        receiptNumber: result.receiptNumber ?? 0,
    };
}

export async function undoPayout(payoutId: string): Promise<void> {
    const supabase = await requireAuth();
    const eventId = await getEventId();

    const { error } = await supabase.from("payouts").delete().eq("id", payoutId).eq("event_id", eventId);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/payouts");
}
