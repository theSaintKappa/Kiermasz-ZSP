import type { Metadata } from "next";
import { getPageTitle } from "../nav-config";

export const metadata: Metadata = {
    title: getPageTitle("stats"),
};

export default function StatsPage() {
    return <h1>hello /stats</h1>;
}
