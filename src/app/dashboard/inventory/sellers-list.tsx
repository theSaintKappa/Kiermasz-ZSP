"use client";

import { SearchIcon, UserAdd02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { filterSellers, type SellerRow } from "./inventory-utils";

interface SellersListProps {
    sellers: SellerRow[];
    onAddClick: () => void;
    activeSellerId: string | null;
}

export function SellersList({ sellers, onAddClick, activeSellerId }: SellersListProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => filterSellers(sellers, search), [sellers, search]);

    return (
        <div className="flex h-full flex-col gap-3">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
                    <Input placeholder="Szukaj..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
                </div>
                <Tooltip>
                    <TooltipTrigger render={<Button size="icon" onClick={onAddClick} />}>
                        <HugeiconsIcon icon={UserAdd02Icon} strokeWidth={2} />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Dodaj sprzedawcę</p>
                    </TooltipContent>
                </Tooltip>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground text-sm">{search ? "Brak wyników" : "Brak sprzedawców"}</p>
                ) : (
                    <SidebarMenu>
                        {filtered.map((seller) => (
                            <SidebarMenuItem key={seller.id}>
                                <SidebarMenuButton isActive={activeSellerId === seller.id} onClick={() => router.push(`/dashboard/inventory/${seller.id}`)}>
                                    <span className="truncate">
                                        {seller.firstName} {seller.lastName}
                                        <span className="ml-1.5 text-muted-foreground text-xs">{seller.classSymbol}</span>
                                    </span>
                                </SidebarMenuButton>
                                <SidebarMenuBadge>{seller.itemCount}</SidebarMenuBadge>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                )}
            </div>
        </div>
    );
}
