import { AddTeamIcon, AlmsIcon, Book02Icon, Calendar02Icon, ChartIcon, HoldLocked01Icon, MoneyReceive02Icon, PencilRulerIcon, PolicyIcon, Scroll01Icon, UserShield01Icon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export type NavItem = {
    title: string;
    url: string;
    icon: IconSvgElement;
};

export type NavGroup = {
    id: string;
    label: string;
    items: NavItem[];
};

export const navGroups: NavGroup[] = [
    {
        id: "intake",
        label: "Przyjmowanie",
        items: [
            { title: "Sprzedawcy", url: "/dashboard/sellers", icon: AddTeamIcon },
            { title: "Tytuły", url: "/dashboard/titles", icon: Book02Icon },
            { title: "Przedmioty", url: "/dashboard/subjects", icon: PencilRulerIcon },
        ],
    },
    {
        id: "transactions",
        label: "Sprzedaż",
        items: [
            { title: "Sprzedawaj", url: "/dashboard/sales", icon: MoneyReceive02Icon },
            { title: "Rezerwacje", url: "/dashboard/reservations", icon: HoldLocked01Icon },
        ],
    },
    {
        id: "withdrawals",
        label: "Wypłaty",
        items: [{ title: "Wypłacaj", url: "/dashboard/withdrawals", icon: AlmsIcon }],
    },
    {
        id: "administration",
        label: "Administracja",
        items: [
            { title: "Statystyki", url: "/dashboard/stats", icon: ChartIcon },
            { title: "Administratorzy", url: "/dashboard/admins", icon: UserShield01Icon },
            { title: "Kalendarz faz", url: "/dashboard/event-phases", icon: Calendar02Icon },
            { title: "Regulamin", url: "/dashboard/terms", icon: PolicyIcon },
            { title: "Dziennik zdarzeń", url: "/dashboard/logs", icon: Scroll01Icon },
        ],
    },
];

export function getPageTitle(segment: string): string {
    return routeSegmentLabels[segment] ?? segment;
}

export const routeSegmentLabels: Record<string, string> = (() => {
    const labels: Record<string, string> = { dashboard: "Panel" };

    for (const group of navGroups) {
        for (const item of group.items) {
            const segment = item.url.split("/").pop();
            if (segment) labels[segment] = item.title;
        }
    }

    return labels;
})();
