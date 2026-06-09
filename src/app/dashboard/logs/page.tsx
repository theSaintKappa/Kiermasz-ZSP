import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPageTitle } from "../nav-config";
import type { LogRow } from "./columns";
import { LogsView } from "./logs-view";

export const metadata: Metadata = {
    title: getPageTitle("logs"),
};

export default async function LogsPage() {
    const supabase = await createClient();

    const { data: rawLogs } = await supabase.from("audit_logs").select("id, admin_id, action, table_name, record_id, old_values, new_values, created_at, event_id, profiles(first_name, last_name)").order("created_at", { ascending: false }).limit(1000);

    const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").order("first_name");

    const logs: LogRow[] = (rawLogs ?? []).map((l) => {
        const profile = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles;
        const adminName = profile?.first_name || profile?.last_name ? `${(profile?.first_name ?? "").trim()} ${(profile?.last_name ?? "").trim()}`.trim() : null;

        return {
            id: l.id,
            adminName,
            action: l.action,
            tableName: l.table_name,
            recordId: l.record_id,
            oldValues: l.old_values as Record<string, unknown> | null,
            newValues: l.new_values as Record<string, unknown> | null,
            createdAt: l.created_at,
            eventId: l.event_id,
        };
    });

    const profileOptions = (profiles ?? []).map((p) => ({
        id: p.id,
        name: `${(p.first_name ?? "").trim()} ${(p.last_name ?? "").trim()}`.trim(),
    }));

    const actionOptions = [...new Set(logs.map((l) => l.action))].sort();
    const tableOptions = [...new Set(logs.map((l) => l.tableName))].sort();

    return <LogsView logs={logs} profileOptions={profileOptions} actionOptions={actionOptions} tableOptions={tableOptions} />;
}
