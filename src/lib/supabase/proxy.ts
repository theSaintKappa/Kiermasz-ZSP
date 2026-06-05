import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

export const updateSession = async (request: NextRequest) => {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet, headers) {
                for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
                supabaseResponse = NextResponse.next({ request });
                for (const { name, value, options } of cookiesToSet) supabaseResponse.cookies.set(name, value, options);
                for (const [key, value] of Object.entries(headers)) supabaseResponse.headers.set(key, value);
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/login";
        redirectUrl.searchParams.set("next", request.nextUrl.pathname);

        const redirectResponse = NextResponse.redirect(redirectUrl);

        for (const { name, value, ...options } of supabaseResponse.cookies.getAll()) {
            redirectResponse.cookies.set(name, value, options);
        }

        return redirectResponse;
    }

    return supabaseResponse;
};
