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
                <HugeiconsIcon icon={icon} />
                <span>{title}</span>
                <HugeiconsIcon icon={ArrowRight01Icon} className="ml-auto" />
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}
