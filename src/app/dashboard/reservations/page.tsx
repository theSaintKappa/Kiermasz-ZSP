import type { Metadata } from "next";
import { getPageTitle } from "../nav-config";

export const metadata: Metadata = {
    title: getPageTitle("reservations"),
};

export default function ReservationsPage() {
    return <h1>hello /reservations</h1>;
}
