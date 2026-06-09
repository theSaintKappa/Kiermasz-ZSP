"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function NavItem({ title, url, icon }: { title: string; url: string; icon: IconSvgElement }) {
    const pathname = usePathname();
    const isActive = pathname === url || pathname.startsWith(`${url}/`);

    return (
        <SidebarMenuItem>
            <SidebarMenuButton tooltip={title} isActive={isActive} render={<Link href={url} />}>
                <HugeiconsIcon strokeWidth={isActive ? 2 : 1.5} icon={icon} />
                <span>{title}</span>
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={isActive ? 2.5 : 1.5} className="ml-auto" />
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}
