"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { textbookTitleServerSchema, textbookTitleUpdateSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function createTitle(formData: FormData): Promise<{ id: string }> {
    const dataJson = formData.get("data");
    if (typeof dataJson !== "string") throw new Error("Brak danych formularza.");

    const parsed = textbookTitleServerSchema.parse(JSON.parse(dataJson));
    const cover = formData.get("cover") as File | null;
    const coverUrl = formData.get("cover_url") as string | null;

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Nie jesteś zalogowany.");

    const { data, error } = await supabase
        .from("textbook_titles")
        .insert({
            isbn: parsed.isbn,
            title: parsed.title,
            subtitle: parsed.subtitle ?? null,
            authors: parsed.authors ?? null,
            publisher: parsed.publisher ?? null,
            publishing_year: parsed.publishing_year ?? null,
            subject_id: parsed.subject_id ?? null,
            level: parsed.level,
        })
        .select("id")
        .single();

    if (error) {
        if (error.code === "23505") throw new Error("Podręcznik z tym ISBN już istnieje.");
        throw new Error(error.message);
    }

    const textbookId = data.id;

    if (cover && cover.size > 0) {
        try {
            const webpBuffer = await sharp(Buffer.from(await cover.arrayBuffer()))
                .webp({ quality: 85 })
                .toBuffer();

            const coverPath = await uploadCoverToStorage(webpBuffer);
            await supabase.from("textbook_titles").update({ cover_path: coverPath }).eq("id", textbookId);
        } catch {
            // Cover upload is optional — don't fail the whole request
        }
    } else if (coverUrl) {
        try {
            const response = await fetch(coverUrl);
            if (!response.ok) throw new Error("Nie udało się pobrać obrazu z podanego adresu.");
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            const webpBuffer = await sharp(imageBuffer).webp({ quality: 85 }).toBuffer();

            const coverPath = await uploadCoverToStorage(webpBuffer);
            await supabase.from("textbook_titles").update({ cover_path: coverPath }).eq("id", textbookId);
        } catch {
            // Cover URL fetch is optional — don't fail the whole request
        }
    }

    revalidatePath("/dashboard/titles");
    return { id: textbookId };
}

export async function updateTitle(formData: FormData): Promise<{ id: string }> {
    const dataJson = formData.get("data");
    if (typeof dataJson !== "string") throw new Error("Brak danych formularza.");

    const { id, data: parsed } = textbookTitleUpdateSchema.parse(JSON.parse(dataJson));
    const cover = formData.get("cover") as File | null;
    const coverUrl = formData.get("cover_url") as string | null;
    const coverRemoved = formData.get("cover_removed") === "true";

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Nie jesteś zalogowany.");

    const { data: existingTitle, error: existingTitleError } = await supabase.from("textbook_titles").select("cover_path").eq("id", id).single();
    if (existingTitleError) throw new Error(existingTitleError.message);

    const { error } = await supabase
        .from("textbook_titles")
        .update({
            title: parsed.title,
            subtitle: parsed.subtitle ?? null,
            authors: parsed.authors ?? null,
            publisher: parsed.publisher ?? null,
            publishing_year: parsed.publishing_year ?? null,
            subject_id: parsed.subject_id ?? null,
            level: parsed.level,
        })
        .eq("id", id);

    if (error) throw new Error(error.message);

    if (coverRemoved) {
        await supabase.from("textbook_titles").update({ cover_path: null }).eq("id", id);
        await removeCoverFromStorage(existingTitle.cover_path);
    } else if (cover && cover.size > 0) {
        try {
            const webpBuffer = await sharp(Buffer.from(await cover.arrayBuffer()))
                .webp({ quality: 85 })
                .toBuffer();
            const coverPath = await uploadCoverToStorage(webpBuffer);
            await supabase.from("textbook_titles").update({ cover_path: coverPath }).eq("id", id);
            await removeCoverFromStorage(existingTitle.cover_path);
        } catch {
            // Cover upload is optional
        }
    } else if (coverUrl) {
        try {
            const response = await fetch(coverUrl);
            if (!response.ok) throw new Error("Nie udało się pobrać obrazu z podanego adresu.");
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            const webpBuffer = await sharp(imageBuffer).webp({ quality: 85 }).toBuffer();
            const coverPath = await uploadCoverToStorage(webpBuffer);
            await supabase.from("textbook_titles").update({ cover_path: coverPath }).eq("id", id);
            await removeCoverFromStorage(existingTitle.cover_path);
        } catch {
            // Cover URL fetch is optional
        }
    }

    revalidatePath("/dashboard/titles");
    return { id };
}

async function uploadCoverToStorage(webpBuffer: Buffer): Promise<string> {
    const coverPath = `covers/${randomUUID()}.webp`;
    const serviceClient = createServiceClient();
    const { error: uploadError } = await serviceClient.storage.from("textbook-covers").upload(coverPath, webpBuffer, {
        contentType: "image/webp",
        upsert: false,
    });

    if (uploadError) throw new Error(uploadError.message);
    return coverPath;
}

async function removeCoverFromStorage(coverPath: string | null) {
    if (!coverPath) return;
    const serviceClient = createServiceClient();
    await serviceClient.storage.from("textbook-covers").remove([coverPath]);
}

export async function deleteTitle(id: string): Promise<void> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Nie jesteś zalogowany.");

    const { data: title, error: titleError } = await supabase.from("textbook_titles").select("cover_path").eq("id", id).single();
    if (titleError) throw new Error(titleError.message);

    const { count } = await supabase.from("textbook_items").select("id", { count: "exact", head: true }).eq("title_id", id);
    if (count && count > 0) {
        throw new Error("Nie można usunąć tytułu, który ma przypisane egzemplarze. Usuń je najpierw.");
    }

    const { error } = await supabase.from("textbook_titles").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await removeCoverFromStorage(title.cover_path);

    revalidatePath("/dashboard/titles");
}
