"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function useOnlineStatus() {
    useEffect(() => {
        const toastId = "connection-status";

        const handleOnline = () => {
            toast.success("Przywrócono połączenie z internetem", {
                id: toastId,
                duration: 3000,
            });
        };

        const handleOffline = () => {
            toast.error("Brak połączenia z internetem", {
                id: toastId,
                duration: Infinity,
            });
        };

        if (!navigator.onLine) {
            toast.error("Brak połączenia z internetem", {
                id: toastId,
                duration: Infinity,
            });
        }

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            toast.dismiss(toastId);
        };
    }, []);
}
