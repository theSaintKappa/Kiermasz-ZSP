import type { Metadata } from "next";
import { getPageTitle } from "../nav-config";

export const metadata: Metadata = {
    title: getPageTitle("sellers"),
};

export default function SellersPage() {
    return <h1>hello /sellers</h1>;
}
