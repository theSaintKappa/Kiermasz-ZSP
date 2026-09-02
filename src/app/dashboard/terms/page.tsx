import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPageTitle } from "../nav-config";
import { TermsEditor } from "./terms-editor";

export const metadata: Metadata = {
    title: getPageTitle("terms"),
};

export default async function TermsPage() {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const eventId = cookieStore.get("x-event-id")?.value;

    const { data: terms } = eventId ? await supabase.from("terms").select("content, updated_at").eq("event_id", eventId).maybeSingle() : { data: null };

    return <TermsEditor key={eventId ?? "none"} eventId={eventId ?? null} initialContent={terms?.content ?? ""} initialUpdatedAt={terms?.updated_at ?? null} />;
}
