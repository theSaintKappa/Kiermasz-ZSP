import { Calendar02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site-config";
import { CatalogSection } from "./catalog-section";
import { CatalogShell } from "./catalog-shell";
import { resolveKiermaszState } from "./kiermasz-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: `Katalog | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: `Katalog | ${SITE_NAME}`,
        description: SITE_DESCRIPTION,
        url: "/",
        siteName: SITE_NAME,
        locale: "pl_PL",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: `Katalog | ${SITE_NAME}`,
        description: SITE_DESCRIPTION,
    },
};

function Header() {
    return (
        <header className="border-b">
            <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Image src="/logo.svg" alt={`${SITE_NAME} — logo`} width={169} height={36} className="h-8 w-auto dark:invert" />
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <Button nativeButton={false} render={<Link href="/login" />}>
                        Zaloguj się
                    </Button>
                </div>
            </div>
        </header>
    );
}

export function Footer() {
    return (
        <footer className="mt-auto border-t py-6 text-center text-muted-foreground text-sm">
            <Link href="/terms" className="underline-offset-4 hover:underline">
                Regulamin
            </Link>
            <span className="mx-2">·</span>
            Stworzone z ❤️ przez{" "}
            <Link href="https://github.com/theSaintKappa" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                Wojtka Zrałka
            </Link>
        </footer>
    );
}

export function CatalogSkeleton() {
    return (
        <div className="flex w-full flex-col pt-4">
            <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
                {Array.from({ length: 12 }, (_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: what else am I supposed to use
                    <div key={`sk-${i}`}>
                        <Skeleton className="aspect-210/297 w-full rounded-xl" />
                        <div className="space-y-2 p-2">
                            <Skeleton className="h-4.25 w-3/4" />
                            <div className="space-y-1">
                                <Skeleton className="h-[12.5px] w-full" />
                                <Skeleton className="h-[12.5px] w-1/5" />
                            </div>
                            <Skeleton className="h-4.25 w-1/5 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const { q } = await searchParams;
    const initialQuery = q?.trim() ?? "";

    const state = await resolveKiermaszState();

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/?q={search_term_string}`,
            "query-input": "required name=search_term_string",
        },
    };

    if (state.kind !== "selling") {
        return (
            <main className="flex min-h-svh w-full flex-col">
                <Header />
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center">
                        <HugeiconsIcon icon={Calendar02Icon} className="size-10 text-muted-foreground" />
                        <h2 className="font-bold font-heading text-2xl">{state.title}</h2>
                        {state.body && <p className="text-muted-foreground">{state.body}</p>}
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="flex min-h-svh w-full flex-col">
            <Header />
            <h1 className="sr-only">Katalog podręczników — {SITE_NAME}</h1>
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data for SEO */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
            <div className="mx-auto w-full max-w-7xl">
                <CatalogShell initialQuery={initialQuery}>
                    <Suspense fallback={<CatalogSkeleton />}>
                        <CatalogSection initialQuery={initialQuery} />
                    </Suspense>
                </CatalogShell>
            </div>
            <Footer />
        </main>
    );
}
