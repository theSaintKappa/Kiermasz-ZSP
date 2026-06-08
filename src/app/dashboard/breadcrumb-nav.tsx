"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { routeSegmentLabels } from "./nav-config";

type BreadcrumbOverrides = Record<string, string>;

const BreadcrumbOverrideContext = createContext<BreadcrumbOverrides>({});
const SetBreadcrumbOverrideContext = createContext<(segment: string, label: string) => void>(() => {});

export function useBreadcrumbOverrides() {
    return useContext(BreadcrumbOverrideContext);
}

export function useSetBreadcrumbLabel() {
    return useContext(SetBreadcrumbOverrideContext);
}

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [overrides, setOverrides] = useState<BreadcrumbOverrides>({});

    const setLabel = useCallback((segment: string, label: string) => {
        setOverrides((prev) => ({ ...prev, [segment]: label }));
    }, []);

    return (
        <BreadcrumbOverrideContext.Provider value={overrides}>
            <SetBreadcrumbOverrideContext.Provider value={setLabel}>{children}</SetBreadcrumbOverrideContext.Provider>
        </BreadcrumbOverrideContext.Provider>
    );
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
