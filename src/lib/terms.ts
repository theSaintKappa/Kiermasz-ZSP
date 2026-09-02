import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

export interface ResolvedTerms {
    content: string;
    updatedAt: string;
}

export async function resolveCurrentTerms(): Promise<ResolvedTerms | null> {
    const supabase = createServiceClient();

    const { data: events, error: eventsError } = await supabase.from("events").select("*, phases:event_phases(*)").neq("status", "archived");

    if (eventsError || !events?.length) return null;

    const now = new Date().toISOString();
    const seen = new Set<string>();
    const candidateIds: string[] = [];

    for (const e of events.filter((e) => e.status === "active").sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))) {
        if (!seen.has(e.id)) {
            seen.add(e.id);
            candidateIds.push(e.id);
        }
    }

    for (const e of events) {
        if (seen.has(e.id)) continue;
        const hasCurrentPhase = (e.phases ?? []).some((p: { starts_at: string | null; ends_at: string | null }) => p.starts_at && p.starts_at <= now && (!p.ends_at || p.ends_at > now));
        if (hasCurrentPhase) {
            seen.add(e.id);
            candidateIds.push(e.id);
        }
    }

    const upcoming: { id: string; nextStart: string }[] = [];
    for (const e of events) {
        if (seen.has(e.id)) continue;
        const futurePhases = (e.phases ?? []).filter((p: { starts_at: string | null }) => p.starts_at && p.starts_at > now);
        if (futurePhases.length > 0) {
            const earliest = futurePhases.reduce((min: string, p: { starts_at: string | null }) => (p.starts_at && p.starts_at < min ? p.starts_at : min), futurePhases[0].starts_at as string);
            upcoming.push({ id: e.id, nextStart: earliest });
        }
    }
    upcoming.sort((a, b) => a.nextStart.localeCompare(b.nextStart));
    for (const u of upcoming) {
        if (!seen.has(u.id)) {
            seen.add(u.id);
            candidateIds.push(u.id);
        }
    }

    for (const e of events) {
        if (!seen.has(e.id)) {
            seen.add(e.id);
            candidateIds.push(e.id);
        }
    }

    if (candidateIds.length === 0) return null;

    const { data: termsRows, error: termsError } = await supabase.from("terms").select("event_id, content, updated_at").in("event_id", candidateIds);

    if (termsError) return null;

    const termsMap = new Map<string, { content: string; updated_at: string }>();
    for (const row of termsRows ?? []) {
        termsMap.set(row.event_id, { content: row.content, updated_at: row.updated_at });
    }

    for (const id of candidateIds) {
        const doc = termsMap.get(id);
        if (doc && doc.content.trim() !== "") {
            return { content: doc.content, updatedAt: doc.updated_at };
        }
    }

    return null;
}
