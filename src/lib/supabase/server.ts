import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/env";

export const createClient = async () => {
    const cookieStore = await cookies();

    return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (cookiesToSet, _headers) => {
                try {
                    for (const { name, value, options } of cookiesToSet) {
                        cookieStore.set(name, value, options);
                    }
                } catch {
                    // The `setAll` method was called from a Server Component.
                }
            },
        },
    });
};
