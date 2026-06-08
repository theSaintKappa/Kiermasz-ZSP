"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";

export function OnlineStatus() {
    useOnlineStatus();
    return null;
}
