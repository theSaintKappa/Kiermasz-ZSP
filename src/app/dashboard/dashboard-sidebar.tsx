"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarRail } from "@/components/ui/sidebar";
import { useEventStore } from "@/stores/event-store";
import { EventSwitcher } from "./event-switcher";
import { navGroups } from "./nav-config";
import { NavItem } from "./nav-item";
import { NavUser } from "./nav-user";

export function DashboardSidebar() {
    const selectedEventId = useEventStore((s) => s.selectedEventId);

    return (
        <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader>
                <EventSwitcher />
            </SidebarHeader>
            {selectedEventId ? (
                <>
                    <SidebarContent>
                        {navGroups.map((group) => (
                            <SidebarGroup key={group.id}>
                                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                                <SidebarMenu>
                                    {group.items.map((item) => (
                                        <NavItem key={item.title} title={item.title} url={item.url} icon={item.icon} />
                                    ))}
                                </SidebarMenu>
                            </SidebarGroup>
                        ))}
                    </SidebarContent>
                    <SidebarRail />
                </>
            ) : (
                <SidebarContent />
            )}
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
