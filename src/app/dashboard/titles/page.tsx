import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPageTitle } from "../nav-config";
import type { TextbookRow } from "./create-title-dialog";
import { type TextbookGroup, TitlesView } from "./titles-view";

export const metadata: Metadata = {
    title: getPageTitle("titles"),
};

export default async function TitlesPage() {
    const supabase = await createClient();

    const { data: titles } = await supabase.from("textbook_titles").select("id, isbn, title, subtitle, authors, publisher, publishing_year, subject_id, level, cover_path, created_at, subjects(name)").order("title");

    const { data: subjects } = await supabase.from("subjects").select("id, name").order("name");

    const { data: itemRows } = await supabase.from("textbook_items").select("title_id");

    const countByTitle = new Map<string, number>();
    for (const row of itemRows ?? []) {
        if (row.title_id) {
            countByTitle.set(row.title_id, (countByTitle.get(row.title_id) ?? 0) + 1);
        }
    }

    const subjectNames = new Map<string, string>();
    for (const s of subjects ?? []) {
        subjectNames.set(s.id, s.name);
    }

    const rows: (TextbookRow & { subjectName: string | null })[] = (titles ?? []).map((t) => ({
        id: t.id,
        isbn: t.isbn,
        title: t.title,
        subtitle: t.subtitle,
        authors: t.authors ?? [],
        publisher: t.publisher,
        publishing_year: t.publishing_year,
        subject_id: t.subject_id,
        subject_name: (t.subjects as unknown as { name: string } | null)?.name ?? null,
        level: t.level as TextbookRow["level"],
        cover_path: t.cover_path,
        created_at: t.created_at,
        subjectName: (t.subjects as unknown as { name: string } | null)?.name ?? null,
        itemCount: countByTitle.get(t.id) ?? 0,
    }));

    const groupMap = new Map<string, TextbookRow[]>();
    const noSubjectGroup = "Bez przedmiotu";

    for (const row of rows) {
        const key = row.subjectName ?? noSubjectGroup;
        const group = groupMap.get(key);
        if (group) {
            group.push(row);
        } else {
            groupMap.set(key, [row]);
        }
    }

    const groups: TextbookGroup[] = Array.from(groupMap.entries())
        .sort(([a], [b]) => {
            if (a === noSubjectGroup) return 1;
            if (b === noSubjectGroup) return -1;
            return a.localeCompare(b, "pl");
        })
        .map(([subjectName, textbooks]) => ({
            subjectName,
            textbooks: textbooks.sort((a, b) => a.title.localeCompare(b.title, "pl")),
        }));

    return <TitlesView groups={groups} subjectNames={subjectNames} />;
}
