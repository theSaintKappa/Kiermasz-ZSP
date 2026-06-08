import type { Metadata } from "next";
import { getPageTitle } from "../nav-config";

export const metadata: Metadata = {
    title: getPageTitle("withdrawals"),
};

export default function WithdrawalsPage() {
    return <h1>hello /withdrawals</h1>;
}
