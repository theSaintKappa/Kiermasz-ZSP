import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

interface UserState {
    isSuperAdmin: boolean;
    isLoading: boolean;

    initialize: () => Promise<void>;
}

export const useUserStore = create<UserState>()((set) => ({
    isSuperAdmin: false,
    isLoading: true,

    initialize: async () => {
        try {
            const supabase = createClient();

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                set({ isSuperAdmin: false, isLoading: false });
                return;
            }

            const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

            set({
                isSuperAdmin: profile?.role === "super_admin",
                isLoading: false,
            });
        } catch {
            set({ isLoading: false });
        }
    },
}));
