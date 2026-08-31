import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EducationLevel } from "@/lib/textbook-utils";

export interface CartItem {
    itemId: string;
    titleId: string;
    sellerId: string;
    sellerFirstName: string;
    sellerLastName: string;
    classSymbol: string;
    title: string;
    subtitle: string | null;
    isbn: string;
    price: number;
    level: EducationLevel;
    publisher: string | null;
    publishingYear: number | null;
    subjectName: string | null;
}

interface CartState {
    eventId: string | null;
    items: CartItem[];
    conflictIds: string[];

    addItem: (item: CartItem) => boolean;
    removeItem: (itemId: string) => void;
    clear: () => void;
    setConflicts: (ids: string[]) => void;
    syncEvent: (eventId: string | null) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            eventId: null,
            items: [],
            conflictIds: [],

            addItem: (item) => {
                const { items } = get();
                if (items.some((i) => i.itemId === item.itemId)) return false;
                set({ items: [...items, item] });
                return true;
            },

            removeItem: (itemId) => {
                set((state) => ({
                    items: state.items.filter((i) => i.itemId !== itemId),
                    conflictIds: state.conflictIds.filter((id) => id !== itemId),
                }));
            },

            clear: () => set({ items: [], conflictIds: [] }),

            setConflicts: (ids) => set({ conflictIds: ids }),

            syncEvent: (eventId) => {
                const { eventId: currentEventId } = get();
                if (currentEventId !== eventId) {
                    set({ eventId, items: [], conflictIds: [] });
                }
            },
        }),
        {
            name: "cart-store",
            partialize: (state) => ({ eventId: state.eventId, items: state.items }),
        },
    ),
);

export function cartTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
}
