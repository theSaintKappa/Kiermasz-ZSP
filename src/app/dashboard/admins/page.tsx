import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPageTitle } from "../nav-config";
import type { AdminRow } from "./admins-table";
import { AdminsView } from "./admins-view";

export const metadata: Metadata = {
    title: getPageTitle("admins"),
};

export default async function AdminsPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name, email, role, created_at").order("first_name");

    const admins: AdminRow[] = (profiles ?? []).map((p) => ({
        id: p.id,
        firstName: p.first_name ?? "",
        lastName: p.last_name ?? "",
        email: p.email ?? "",
        role: p.role as AdminRow["role"],
        createdAt: p.created_at ?? "",
    }));

    return <AdminsView admins={admins} currentUserId={user?.id} />;
}
