import type { Metadata } from "next";
import { getPageTitle } from "../nav-config";
import { IsbnLookupTest } from "./isbn-lookup-test";

export const metadata: Metadata = {
    title: getPageTitle("titles"),
};

export default function TitlesPage() {
    return <IsbnLookupTest />;
}
