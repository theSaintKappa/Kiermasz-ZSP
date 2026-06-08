import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearEventCookie, setEventCookie } from "@/lib/event-cookie";
import type { Event } from "@/lib/event-utils";
import { createClient } from "@/lib/supabase/client";

interface EventState {
    events: Event[];
    selectedEventId: string | null;
    isLoading: boolean;

    selectEvent: (eventId: string | null) => void;
    refreshEvents: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useEventStore = create<EventState>()(
    persist(
        (set, get) => ({
            events: [],
            selectedEventId: null,
            isLoading: true,

            selectEvent: (eventId) => {
                const id = eventId || null;
                if (id) setEventCookie(id);
                else clearEventCookie();
                set({ selectedEventId: id });
            },

            refreshEvents: async () => {
                const supabase = createClient();

                try {
                    const { data, error } = await supabase.from("events").select("*, phases:event_phases(*)").order("created_at", { ascending: false });

                    if (error) {
                        console.error("Failed to fetch events:", error.message);
                        return;
                    }

                    const events = data ?? [];
                    const state = get();

                    let selectedEventId = state.selectedEventId;
                    if (selectedEventId && !events.some((e) => e.id === selectedEventId)) selectedEventId = null;

                    if (!selectedEventId && events.length > 0) {
                        const active = events.find((e) => e.status === "active");
                        selectedEventId = active ? active.id : events[0].id;
                    }

                    set({ events, selectedEventId });

                    if (selectedEventId) setEventCookie(selectedEventId);
                } catch (err) {
                    console.error("Error refreshing events:", err);
                }
            },

            initialize: async () => {
                const supabase = createClient();

                try {
                    const { data, error } = await supabase.from("events").select("*, phases:event_phases(*)").order("created_at", { ascending: false });

                    if (error) {
                        console.error("Failed to fetch events:", error.message);
                        set({ isLoading: false });
                        return;
                    }

                    const events = data ?? [];

                    let selectedEventId = get().selectedEventId;
                    if (selectedEventId && !events.some((e) => e.id === selectedEventId)) selectedEventId = null;

                    if (!selectedEventId && events.length > 0) {
                        const active = events.find((e) => e.status === "active");
                        selectedEventId = active ? active.id : events[0].id;
                    }

                    set({
                        events,
                        selectedEventId,
                        isLoading: false,
                    });

                    if (selectedEventId) setEventCookie(selectedEventId);
                } catch (err) {
                    console.error("Error initializing event store:", err);
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: "event-store",
            partialize: (state) => ({ selectedEventId: state.selectedEventId }),
        },
    ),
);

export function useSelectedEvent(): Event | null {
    return useEventStore((s) => s.events.find((e) => e.id === s.selectedEventId) ?? null);
}
