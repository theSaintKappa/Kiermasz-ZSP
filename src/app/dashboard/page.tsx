import type { Metadata } from "next";
import { getPageTitle } from "./nav-config";

export const metadata: Metadata = {
    title: getPageTitle("dashboard"),
};

export default async function DashboardPage() {
    return (
        <div className="flex w-full flex-col gap-4">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
            </div>
            <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </div>
    );
}
