"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogOutButton() {
    const router = useRouter();
    const supabase = createClient();

    const handleLogOut = async () => {
        await supabase.auth.signOut();
        router.replace("/");
        router.refresh();
    };

    return <Button onClick={handleLogOut}>Log Out</Button>;
}
