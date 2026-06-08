import type { Metadata } from "next";
import { getPageTitle } from "../nav-config";

export const metadata: Metadata = {
    title: getPageTitle("titles"),
};

export default function TitlesPage() {
    return <h1>hello /titles</h1>;
}
