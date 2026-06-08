"use client";

import { ComputerIcon, Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ModeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="relative" />}>
                <HugeiconsIcon icon={Sun01Icon} className="dark:-rotate-90 rotate-0 scale-100 transition-all dark:scale-0" />
                <HugeiconsIcon icon={Moon02Icon} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Motyw</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                        <DropdownMenuRadioItem value="light">
                            <HugeiconsIcon icon={Sun01Icon} />
                            Jasny
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dark">
                            <HugeiconsIcon icon={Moon02Icon} />
                            Ciemny
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="system">
                            <HugeiconsIcon icon={ComputerIcon} />
                            System
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
