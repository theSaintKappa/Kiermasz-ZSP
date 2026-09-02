import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import { OnlineStatus } from "@/components/online-status";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import "./globals.css";

const outfitSans = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
    title: { template: "%s | Kiermasz ZSP", default: "Kiermasz ZSP" },
    description: 'Oficjalny kiermasz książek ZSP "Mechanik". Sprzedawaj i kupuj podręczniki szkolne znacznie taniej niż w księgarniach. Szybko, lokalnie i w 100% bez prowizji i opłat. Od uczniów dla uczniów.',
    keywords: ["kiermasz", "książki", "podręczniki", "ZSP", "ZSTiO", "Mechanik", "Tarnowskie Góry", "UCZĘSIĘWTG", "sprzedawaj", "kupuj", "taniej", "szybko", "lokalnie", "bez prowizji"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="pl" className={cn("antialiased", outfitSans.variable, jetBrainsMono.variable)} suppressHydrationWarning>
            <body className="flex min-h-full flex-col">
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <TooltipProvider>{children}</TooltipProvider>
                    <Toaster richColors />
                    <OnlineStatus />
                </ThemeProvider>
            </body>
        </html>
    );
}
