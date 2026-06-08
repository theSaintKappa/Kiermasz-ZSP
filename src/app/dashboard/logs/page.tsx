import type { Metadata } from "next";
import { getPageTitle } from "../nav-config";

export const metadata: Metadata = {
    title: getPageTitle("logs"),
};

export default function LogsPage() {
    return <h1>hello /logs</h1>;
}
