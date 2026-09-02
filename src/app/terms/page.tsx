import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDateTime } from "@/lib/format-utils";
import { resolveCurrentTerms } from "@/lib/terms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Regulamin",
};

export default async function TermsPage() {
    const terms = await resolveCurrentTerms();

    return (
        <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-4 p-6 md:p-10">
            <Link href="/" className="mx-auto">
                <Image src="/logo.svg" alt="Logo" width={100} height={100} className="h-24 w-auto dark:invert" />
            </Link>
            <h1 className="font-bold font-heading text-3xl">Regulamin</h1>
            {terms ? (
                <>
                    <p className="text-muted-foreground text-sm">Ostatnia aktualizacja: {formatDateTime(terms.updatedAt)}</p>
                    <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{terms.content}</ReactMarkdown>
                    </div>
                </>
            ) : (
                <p className="text-muted-foreground text-sm">Regulamin nie jest jeszcze dostępny.</p>
            )}
        </main>
    );
}
