import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPageTitle } from "../nav-config";
import { mapLogRow, PAGE_SIZE_OPTIONS } from "./logs-utils";
import { LogsView } from "./logs-view";

export const metadata: Metadata = {
    title: getPageTitle("logs"),
};

const SORT_COLUMNS: Record<string, string> = {
    createdAt: "created_at",
    action: "action",
    tableName: "table_name",
};

interface LogsPageProps {
    searchParams: Promise<{
        page?: string;
        pageSize?: string;
        adminId?: string;
        action?: string;
        tableName?: string;
        sort?: string;
        order?: string;
    }>;
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
    const params = await searchParams;
    const page = Math.max(0, parseInt(params.page ?? "0", 10) || 0);
    const VALID_PAGE_SIZES: Set<number> = new Set(PAGE_SIZE_OPTIONS);
    const pageSize = VALID_PAGE_SIZES.has(Number(params.pageSize)) ? Number(params.pageSize) : PAGE_SIZE_OPTIONS[0];
    const adminId = params.adminId ?? "";
    const action = params.action ?? "";
    const tableName = params.tableName ?? "";
    const sortCol = SORT_COLUMNS[params.sort ?? ""] ?? "created_at";
    const ascending = params.order === "asc";

    const supabase = await createClient();
    const cookieStore = await cookies();
    const eventId = cookieStore.get("x-event-id")?.value ?? null;

    const eventFilter = eventId ? `event_id.eq.${eventId},event_id.is.null` : null;

    try {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        let logsQuery = supabase.from("audit_logs").select("id, admin_id, action, table_name, record_id, old_values, new_values, created_at, event_id, profiles(first_name, last_name)").order(sortCol, { ascending }).range(from, to);

        let countQuery = supabase.from("audit_logs").select("id", { count: "exact", head: true });

        let actionsQuery = supabase.from("audit_logs").select("action");
        let tablesQuery = supabase.from("audit_logs").select("table_name");

        if (eventFilter) {
            logsQuery = logsQuery.or(eventFilter);
            countQuery = countQuery.or(eventFilter);
            actionsQuery = actionsQuery.or(eventFilter);
            tablesQuery = tablesQuery.or(eventFilter);
        }
        if (adminId) {
            logsQuery = logsQuery.eq("admin_id", adminId);
            countQuery = countQuery.eq("admin_id", adminId);
            actionsQuery = actionsQuery.eq("admin_id", adminId);
            tablesQuery = tablesQuery.eq("admin_id", adminId);
        }
        if (action) {
            logsQuery = logsQuery.eq("action", action);
            countQuery = countQuery.eq("action", action);
            tablesQuery = tablesQuery.eq("action", action);
        }
        if (tableName) {
            logsQuery = logsQuery.eq("table_name", tableName);
            countQuery = countQuery.eq("table_name", tableName);
            actionsQuery = actionsQuery.eq("table_name", tableName);
        }

        const [{ data: rawLogs }, { count }, { data: actionRows }, { data: tableRows }, { data: profiles }] = await Promise.all([logsQuery, countQuery, actionsQuery, tablesQuery, supabase.from("profiles").select("id, first_name, last_name").order("first_name")]);

        const profileOptions = (profiles ?? []).map((p) => ({
            id: p.id,
            name: `${(p.first_name ?? "").trim()} ${(p.last_name ?? "").trim()}`.trim(),
        }));

        const actionOptions = [...new Set((actionRows ?? []).map((r) => r.action))].sort();
        const tableOptions = [...new Set((tableRows ?? []).map((r) => r.table_name))].sort();

        const logs = (rawLogs ?? []).map((l) => mapLogRow(l));

        return <LogsView logs={logs} totalCount={count ?? 0} eventId={eventId} profileOptions={profileOptions} actionOptions={actionOptions} tableOptions={tableOptions} />;
    } catch (err) {
        const message = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
        return <LogsView logs={[]} totalCount={0} eventId={eventId} profileOptions={[]} actionOptions={[]} tableOptions={[]} error={message} />;
    }
}
