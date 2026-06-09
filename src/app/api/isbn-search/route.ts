import { NextResponse } from "next/server";
import { parseBnResponse } from "@/lib/bn-parser";
import { createClient } from "@/lib/supabase/server";
import type { TextbookLookupResult } from "@/lib/textbook-utils";

const BN_API_URL = "https://data.bn.org.pl/api/networks/bibs.json";

function validateIsbn(raw: string): string | null {
    const cleaned = raw.replace(/[\s-]/g, "");
    if (cleaned.length !== 10 && cleaned.length !== 13) return null;
    if (!/^\d+$/.test(cleaned)) return null;
    return cleaned;
}

async function lookupSubject(supabase: Awaited<ReturnType<typeof createClient>>, subject: string | null): Promise<{ subject_id: string | null; subject_matched: boolean }> {
    if (!subject) return { subject_id: null, subject_matched: false };

    const { data } = await supabase.from("subjects").select("id").ilike("name", subject).maybeSingle();

    if (data) return { subject_id: data.id, subject_matched: true };

    return { subject_id: null, subject_matched: false };
}

export async function GET(request: Request): Promise<NextResponse> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nie jesteś zalogowany." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const rawIsbn = searchParams.get("isbn");
    if (!rawIsbn) return NextResponse.json({ error: "Brak parametru isbn." }, { status: 400 });

    const isbn = validateIsbn(rawIsbn);
    if (!isbn) return NextResponse.json({ error: "Nieprawidłowy format ISBN." }, { status: 400 });

    let bnData: unknown;
    try {
        const response = await fetch(`${BN_API_URL}?isbnIssn=${isbn}`);
        if (!response.ok) return NextResponse.json({ error: "API Biblioteki Narodowej jest niedostępne." }, { status: 502 });

        bnData = await response.json();
    } catch {
        return NextResponse.json({ error: "Nie udało się połączyć z API Biblioteki Narodowej." }, { status: 502 });
    }

    const metadata = parseBnResponse(bnData as Parameters<typeof parseBnResponse>[0]);
    if (!metadata) return NextResponse.json({ error: "Nie znaleziono podręcznika dla tego ISBN." }, { status: 404 });

    const { subject_id, subject_matched } = await lookupSubject(supabase, metadata.subject);

    const result: TextbookLookupResult = {
        ...metadata,
        subject_id,
        subject_matched,
    };

    return NextResponse.json(result);
}
