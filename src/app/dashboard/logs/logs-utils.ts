export interface LogRow {
    id: string;
    adminId: string | null;
    adminName: string | null;
    action: string;
    tableName: string;
    recordId: string | null;
    oldValues: Record<string, unknown> | null;
    newValues: Record<string, unknown> | null;
    createdAt: string;
    eventId: string | null;
}

export const PAGE_SIZE_OPTIONS = [50, 100, 250] as const;

interface RawLog {
    id: string;
    admin_id: string | null;
    action: string;
    table_name: string;
    record_id: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    created_at: string;
    event_id: string | null;
    profiles?: { first_name: string | null; last_name: string | null }[] | { first_name: string | null; last_name: string | null };
}

export function mapLogRow(raw: RawLog): LogRow {
    const profile = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
    const adminName = profile?.first_name || profile?.last_name ? `${(profile?.first_name ?? "").trim()} ${(profile?.last_name ?? "").trim()}`.trim() : null;

    return {
        id: raw.id,
        adminId: raw.admin_id,
        adminName,
        action: raw.action,
        tableName: raw.table_name,
        recordId: raw.record_id,
        oldValues: raw.old_values,
        newValues: raw.new_values,
        createdAt: raw.created_at,
        eventId: raw.event_id,
    };
}
