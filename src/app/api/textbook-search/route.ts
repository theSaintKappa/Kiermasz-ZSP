import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<NextResponse> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nie jesteś zalogowany." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

    if (query.length === 0) {
        const { data, error } = await supabase.rpc("search_textbook_titles_popular", { p_limit: limit });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data ?? []);
    }

    const { data, error } = await supabase.rpc("search_textbook_titles", { p_query: query, p_limit: limit });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
}
