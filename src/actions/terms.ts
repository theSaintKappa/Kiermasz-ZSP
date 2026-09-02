"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireSuperAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Nie jesteś zalogowany.");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "super_admin") throw new Error("Tylko super administrator może edytować regulamin.");
    return { supabase, user };
}

const MAX_CONTENT_LENGTH = 100_000;

export async function saveTerms(eventId: string, content: string): Promise<{ updatedAt: string }> {
    if (!eventId) throw new Error("Nie wybrano wydarzenia.");
    if (typeof content !== "string" || content.length > MAX_CONTENT_LENGTH) {
        throw new Error("Nieprawidłowa zawartość regulaminu.");
    }

    const { supabase, user } = await requireSuperAdmin();

    const { data, error } = await supabase.from("terms").upsert({ event_id: eventId, content, updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: "event_id" }).select("updated_at").single();
    if (error) throw new Error(error.message);

    revalidatePath("/terms");
    revalidatePath("/dashboard/terms");
    return { updatedAt: data.updated_at };
}
