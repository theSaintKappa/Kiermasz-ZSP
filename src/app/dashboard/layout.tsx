import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { EventGuard } from "./event-guard";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <SidebarProvider>
            <DashboardSidebar />
            <SidebarInset>
                <DashboardHeader />
                <main className="flex flex-1 p-4">
                    <EventGuard>{children}</EventGuard>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
