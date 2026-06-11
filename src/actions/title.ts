"use server";

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

            await uploadCoverToStorage(webpBuffer, textbookId, supabase);
        } catch {
            // Cover upload is optional — don't fail the whole request
        }
    } else if (coverUrl) {
        try {
            const response = await fetch(coverUrl);
            if (!response.ok) throw new Error("Nie udało się pobrać obrazu z podanego adresu.");
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            const webpBuffer = await sharp(imageBuffer).webp({ quality: 85 }).toBuffer();

            await uploadCoverToStorage(webpBuffer, textbookId, supabase);
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
        const serviceClient = createServiceClient();
        await serviceClient.storage.from("textbook-covers").remove([`covers/${id}.webp`]);
    } else if (cover && cover.size > 0) {
        try {
            const webpBuffer = await sharp(Buffer.from(await cover.arrayBuffer()))
                .webp({ quality: 85 })
                .toBuffer();
            await uploadCoverToStorage(webpBuffer, id, supabase);
        } catch {
            // Cover upload is optional
        }
    } else if (coverUrl) {
        try {
            const response = await fetch(coverUrl);
            if (!response.ok) throw new Error("Nie udało się pobrać obrazu z podanego adresu.");
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            const webpBuffer = await sharp(imageBuffer).webp({ quality: 85 }).toBuffer();
            await uploadCoverToStorage(webpBuffer, id, supabase);
        } catch {
            // Cover URL fetch is optional
        }
    }

    revalidatePath("/dashboard/titles");
    return { id };
}

async function uploadCoverToStorage(webpBuffer: Buffer, textbookId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
    const coverPath = `covers/${textbookId}.webp`;
    const serviceClient = createServiceClient();
    const { error: uploadError } = await serviceClient.storage.from("textbook-covers").upload(coverPath, webpBuffer, {
        contentType: "image/webp",
        upsert: true,
    });

    if (!uploadError) {
        await supabase.from("textbook_titles").update({ cover_path: coverPath }).eq("id", textbookId);
    }
}

export async function deleteTitle(id: string): Promise<void> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Nie jesteś zalogowany.");

    const { error } = await supabase.from("textbook_titles").delete().eq("id", id);
    if (error) throw new Error(error.message);

    const serviceClient = createServiceClient();
    await serviceClient.storage.from("textbook-covers").remove([`covers/${id}.webp`]);

    revalidatePath("/dashboard/titles");
}
