import { env } from "@/env";

const BUCKET = "textbook-covers";

export function getCoverUrl(coverPath: string | null | undefined): string | null {
    if (!coverPath) return null;
    return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${coverPath}`;
}
