import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

interface UserState {
    id: string;
    name: string;
    email: string;
    role: string | null;
    isSuperAdmin: boolean;
    isLoading: boolean;

    initialize: () => Promise<void>;
}

export const useUserStore = create<UserState>()((set) => ({
    id: "",
    name: "",
    email: "",
    role: null,
    isSuperAdmin: false,
    isLoading: true,

    initialize: async () => {
        try {
            const supabase = createClient();

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                set({ role: null, isSuperAdmin: false, isLoading: false });
                return;
            }

            const id = user.id;
            const email = user.email || "";

            const { data: profile } = await supabase.from("profiles").select("first_name, last_name, role").eq("id", id).maybeSingle();

            const name = profile?.first_name || profile?.last_name ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "";

            set({
                id,
                name,
                email,
                role: profile?.role ?? null,
                isSuperAdmin: profile?.role === "super_admin",
                isLoading: false,
            });
        } catch {
            set({ isLoading: false });
        }
    },
}));
