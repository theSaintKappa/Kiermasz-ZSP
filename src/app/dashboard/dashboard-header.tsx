"use client";

import { ModeToggle } from "@/components/theme-toggle";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useEventStore } from "@/stores/event-store";
import { DynamicBreadcrumb } from "./breadcrumb-nav";

export function DashboardHeader() {
    const selectedEventId = useEventStore((s) => s.selectedEventId);

    if (!selectedEventId) return null;

    return (
        <header className="flex h-14 shrink-0 items-center border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="mx-2.5 group-has-data-[collapsible=icon]/sidebar-wrapper:mx-1.5" size="icon-lg" />
            <div>
                <Separator orientation="vertical" className="h-6" />
            </div>
            <Breadcrumb className="ml-4">
                <DynamicBreadcrumb />
            </Breadcrumb>
            <div className="mr-3.5 ml-auto">
                <ModeToggle />
            </div>
        </header>
    );
}
