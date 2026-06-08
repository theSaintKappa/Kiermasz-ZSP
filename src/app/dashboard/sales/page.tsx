import type { Metadata } from "next";
import { getPageTitle } from "../nav-config";

export const metadata: Metadata = {
    title: getPageTitle("sales"),
};

export default function SalesPage() {
    return <h1>hello /sales</h1>;
}
