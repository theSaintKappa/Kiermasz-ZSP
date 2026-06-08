import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    title: { template: "%s | Kiermasz ZSTiO", default: "Kiermasz ZSTiO" },
    description: 'Oficjalny kiermasz książek ZSTiO "Mechanik". Sprzedawaj i kupuj podręczniki szkolne znacznie taniej niż w księgarniach. Szybko, lokalnie i w 100% bez prowizji i opłat.',
    keywords: ["kiermasz", "książki", "podręczniki", "ZSTiO", "Mechanik", "sprzedawaj", "kupuj", "taniej", "szybko", "lokalnie", "bez prowizji"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={cn("h-full antialiased", outfit.variable)} suppressHydrationWarning>
            <body className="flex min-h-full flex-col">
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <TooltipProvider>{children}</TooltipProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
