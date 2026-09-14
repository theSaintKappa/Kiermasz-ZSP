import { createClient } from "@/lib/supabase/server";
import { CatalogResults } from "./catalog-results";
import type { PublicCatalogRow } from "./public-catalog-utils";

interface CatalogSectionProps {
    initialQuery: string;
}

export async function CatalogSection({ initialQuery }: CatalogSectionProps) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("search_public_catalog", { p_query: initialQuery });

    if (error) console.error("Public catalog fetch error:", error.message);

    const rows: PublicCatalogRow[] = (data as PublicCatalogRow[]) ?? [];
    return <CatalogResults initialRows={rows} initialQuery={initialQuery} />;
}
