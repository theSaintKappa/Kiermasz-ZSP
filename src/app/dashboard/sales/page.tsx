import type { Metadata } from "next";
import { getPageTitle } from "../nav-config";
import { SalesView } from "./sales-view";

export const metadata: Metadata = { title: getPageTitle("sales") };

interface SalesPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
    const params = await searchParams;
    return <SalesView initialQuery={params.q ?? ""} />;
}
