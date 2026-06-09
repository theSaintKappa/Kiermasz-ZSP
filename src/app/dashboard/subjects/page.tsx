import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPageTitle } from "../nav-config";
import type { SubjectRow } from "./subjects-table";
import { SubjectsView } from "./subjects-view";

export const metadata: Metadata = {
    title: getPageTitle("subjects"),
};

export default async function SubjectsPage() {
    const supabase = await createClient();

    const { data: subjects } = await supabase.from("subjects").select("id, name, created_at").order("name");

    const { data: bookCounts } = await supabase.from("textbook_titles").select("subject_id");

    const countBySubject = new Map<string, number>();
    for (const row of bookCounts ?? []) {
        if (row.subject_id) {
            countBySubject.set(row.subject_id, (countBySubject.get(row.subject_id) ?? 0) + 1);
        }
    }

    const rows: SubjectRow[] = (subjects ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        createdAt: s.created_at ?? "",
        textbookCount: countBySubject.get(s.id) ?? 0,
    }));

    return <SubjectsView subjects={rows} />;
}
