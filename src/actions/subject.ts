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

export async function createSubject(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Nazwa przedmiotu nie może być pusta.");

    const supabase = await requireAuth();

    const { error } = await supabase.from("subjects").insert({ name: trimmed });
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/subjects");
}

export async function createSubjects(names: string[]): Promise<void> {
    const trimmed = names.map((n) => n.trim()).filter((n) => n.length > 0);
    if (!trimmed.length) throw new Error("Nie podano żadnych nazw przedmiotów.");

    const supabase = await requireAuth();

    const { error } = await supabase.from("subjects").insert(trimmed.map((name) => ({ name })));
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/subjects");
}

export async function updateSubject(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Nazwa przedmiotu nie może być pusta.");

    const supabase = await requireAuth();

    const { error } = await supabase.from("subjects").update({ name: trimmed }).eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/subjects");
}

export async function deleteSubject(id: string): Promise<void> {
    const supabase = await requireAuth();

    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/subjects");
}
