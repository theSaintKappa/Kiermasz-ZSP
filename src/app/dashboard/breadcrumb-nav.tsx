"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { create } from "zustand";
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { routeSegmentLabels } from "./nav-config";

type BreadcrumbOverrides = Record<string, string>;

interface BreadcrumbState {
    overrides: BreadcrumbOverrides;
    setLabel: (segment: string, label: string) => void;
}

const useBreadcrumbStore = create<BreadcrumbState>()((set) => ({
    overrides: {},
    setLabel: (segment, label) =>
        set((state) => ({
            overrides: { ...state.overrides, [segment]: label },
        })),
}));

export function useBreadcrumbOverrides() {
    return useBreadcrumbStore((s) => s.overrides);
}

export function useSetBreadcrumbLabel() {
    return useBreadcrumbStore((s) => s.setLabel);
}

function getSegmentLabel(segment: string, overrides: BreadcrumbOverrides): string {
    if (overrides[segment]) return overrides[segment];
    return routeSegmentLabels[segment] ?? segment;
}

export function DynamicBreadcrumb() {
    const pathname = usePathname();
    const overrides = useBreadcrumbOverrides();

    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) return null;

    return (
        <BreadcrumbList>
            {segments.map((segment, index) => {
                const isLast = index === segments.length - 1;
                const label = getSegmentLabel(segment, overrides);
                const href = `/${segments.slice(0, index + 1).join("/")}`;

                return (
                    <span key={segment} className="flex items-center gap-2">
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>{isLast ? <h1 className="font-semibold text-foreground text-sm">{label}</h1> : <BreadcrumbLink render={<Link href={href} />}>{label}</BreadcrumbLink>}</BreadcrumbItem>
                    </span>
                );
            })}
        </BreadcrumbList>
    );
}
