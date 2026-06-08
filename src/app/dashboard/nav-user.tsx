"use client";
import { ArrowUpDownIcon, Logout02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/stores/user-store";

type RememberedAccount = {
    id: string;
    email: string;
    name: string;
};

const getInitials = (name: string) =>
    name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

export function NavUser() {
    const supabase = createClient();
    const router = useRouter();
    const { isMobile } = useSidebar();

    const userId = useUserStore((s) => s.id);
    const userName = useUserStore((s) => s.name);
    const userEmail = useUserStore((s) => s.email);

    const [rememberedAccounts, setRememberedAccounts] = useState<RememberedAccount[]>([]);

    useEffect(() => {
        if (!userId) return;

        const displayName = userName || "User";
        const email = userEmail;

        try {
            const stored = localStorage.getItem("app_remembered_accounts");
            const accounts: RememberedAccount[] = stored ? JSON.parse(stored) : [];

            const existingIdx = accounts.findIndex((a) => a.id === userId);

            const parts = userName.split(" ").filter(Boolean);
            const shortName = parts.length >= 2 ? `${parts[0]} ${parts[1][0].toUpperCase()}.` : displayName;

            const currentAccount: RememberedAccount = { id: userId, email, name: shortName };

            if (existingIdx >= 0) accounts[existingIdx] = currentAccount;
            else accounts.push(currentAccount);

            localStorage.setItem("app_remembered_accounts", JSON.stringify(accounts));
            setRememberedAccounts(accounts.filter((a) => a.id !== userId));
        } catch (e) {
            console.error("Failed to parse registry", e);
        }
    }, [userId, userName, userEmail]);

    const initials = getInitials(userName || "User");

    const handleLogOut = async () => {
        await supabase.auth.signOut();
        router.replace("/");
        router.refresh();
    };

    const handleSwitchAccount = async (targetEmail: string) => {
        await supabase.auth.signOut();
        const url = targetEmail ? `/login?email=${encodeURIComponent(targetEmail)}` : "/login";
        router.push(url);
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground" />}>
                        <Avatar className="size-8 rounded-lg">
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{userName || userEmail}</span>
                            <span className="truncate text-muted-foreground text-xs">{userName ? userEmail : ""}</span>
                        </div>
                        <HugeiconsIcon icon={ArrowUpDownIcon} className="ml-auto size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
                        <DropdownMenuGroup>
                            {rememberedAccounts.length > 0 && (
                                <>
                                    <DropdownMenuLabel>Przełącz konto</DropdownMenuLabel>
                                    {rememberedAccounts.map((acc) => (
                                        <DropdownMenuItem key={acc.id} onClick={() => handleSwitchAccount(acc.email)} className="cursor-pointer gap-2 p-2">
                                            <Avatar className="size-6 rounded-lg">
                                                <AvatarFallback className="text-xs">{getInitials(acc.name || "User")}</AvatarFallback>
                                            </Avatar>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span className="truncate font-medium">{acc.name ? acc.name : acc.email}</span>
                                                <span className="truncate text-muted-foreground text-xs">{acc.name ? acc.email : ""}</span>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </>
                            )}

                            <DropdownMenuItem className="cursor-pointer gap-2 p-2" onClick={() => handleSwitchAccount("")}>
                                <div className="flex size-6 items-center justify-center rounded-md border border-dashed">
                                    <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
                                </div>
                                <div className="font-medium">Dodaj konto</div>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={handleLogOut}>
                            <HugeiconsIcon icon={Logout02Icon} />
                            Wyloguj się
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
