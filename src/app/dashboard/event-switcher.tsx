"use client";

import { Add01Icon, ArrowUpDownIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { LogoShield } from "@/components/logo-shield";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { type EventStatus, getCurrentPhase, phaseLabel, statusLabel } from "@/lib/event-utils";
import { cn } from "@/lib/utils";
import { useEventStore } from "@/stores/event-store";
import { useUserStore } from "@/stores/user-store";
import { CreateEventDialog } from "./create-event-dialog";

const pingColors: Record<EventStatus, string> = {
    planned: "bg-yellow-400",
    active: "bg-green-400",
    archived: "bg-gray-400",
};

export function EventSwitcher() {
    const { isMobile } = useSidebar();
    const { events, selectedEventId, selectEvent } = useEventStore();
    const isSuperAdmin = useUserStore((s) => s.isSuperAdmin);
    const [createOpen, setCreateOpen] = useState(false);

    const selectedEvent = events.find((e) => e.id === selectedEventId);
    const currentPhase = selectedEvent ? getCurrentPhase(selectedEvent.phases) : null;

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground" />}>
                            <LogoShield className="size-8!" />
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <div className="flex items-center gap-1.5">
                                    <span className="truncate font-medium">{selectedEvent?.name ?? "Brak wydarzeń"}</span>
                                    <span className="relative flex size-2">
                                        {selectedEvent?.status === "active" && <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-75", pingColors[selectedEvent?.status ?? "archived"])} />}
                                        <span className={cn("relative inline-flex size-full rounded-full", pingColors[selectedEvent?.status ?? "archived"])} />
                                    </span>
                                </div>
                                {selectedEvent && <span className="truncate text-muted-foreground text-xs">{currentPhase ? phaseLabel(currentPhase.phase) : statusLabel(selectedEvent.status)}</span>}
                            </div>
                            <HugeiconsIcon icon={ArrowUpDownIcon} className="ml-auto" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" align="start" side={isMobile ? "bottom" : "right"} sideOffset={4}>
                            <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-muted-foreground text-xs">Wydarzenia</DropdownMenuLabel>
                                <DropdownMenuRadioGroup value={selectedEventId ?? ""} onValueChange={(v) => v && selectEvent(v)}>
                                    {events.map((event) => {
                                        const eventPhase = getCurrentPhase(event.phases);
                                        return (
                                            <DropdownMenuRadioItem key={event.id} value={event.id} className="gap-2 p-2">
                                                <LogoShield className="size-8!" />
                                                <div className="grid flex-1 text-left">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="truncate text-sm">{event.name}</span>
                                                        <span className="relative flex size-2">
                                                            {event.status === "active" && <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-75", pingColors[event.status ?? "archived"])} />}
                                                            <span className={cn("relative inline-flex size-full rounded-full", pingColors[event.status ?? "archived"])} />
                                                        </span>
                                                    </div>
                                                    <span className="truncate text-muted-foreground text-xs">{eventPhase ? phaseLabel(eventPhase.phase) : statusLabel(event.status)}</span>
                                                </div>
                                            </DropdownMenuRadioItem>
                                        );
                                    })}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuGroup>
                            {isSuperAdmin && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem className="cursor-pointer gap-2 p-2" onClick={() => setCreateOpen(true)}>
                                            <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                                <HugeiconsIcon icon={Add01Icon} className="size-4" />
                                            </div>
                                            <div className="font-medium text-muted-foreground">Dodaj wydarzenie</div>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
            <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
        </>
    );
}
