"use client";

import { FlashlightIcon, FlashlightOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface UseBarcodeScannerOptions {
    onScan: (isbn: string) => void;
}

export function useBarcodeScanner({ onScan }: UseBarcodeScannerOptions) {
    const [open, setOpen] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [torchSupported, setTorchSupported] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const onScanRef = useRef(onScan);
    onScanRef.current = onScan;
    const lastScannedRef = useRef<string | null>(null);

    const stop = useCallback(async () => {
        lastScannedRef.current = null;
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
            } catch {
                // scanner not running
            }
            scannerRef.current = null;
        }
        setOpen(false);
        setTorchOn(false);
        setTorchSupported(false);
        setError(null);
    }, []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: stop is stable and we only want to call it on unmount
    useEffect(() => {
        return () => {
            void stop();
        };
    }, []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: stop is stable and we only want to call it when dialog opens/closes
    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        const el = document.getElementById("barcode-scanner");
        if (!el) return;

        const scanner = new Html5Qrcode("barcode-scanner", {
            formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8],
            verbose: false,
        });
        scannerRef.current = scanner;

        (async () => {
            try {
                const cameras = await Html5Qrcode.getCameras();
                if (cameras.length === 0) {
                    if (!cancelled) {
                        setError("Nie znaleziono kamery.");
                        setOpen(false);
                    }
                    return;
                }

                if (cancelled) return;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: (viewfinderWidth, viewfinderHeight) => {
                            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                            const size = Math.floor(minEdge * 0.75);
                            const threshold = 250;
                            if (size < threshold) {
                                const w = Math.min(viewfinderWidth, threshold);
                                const h = Math.min(viewfinderHeight, threshold);
                                return { width: w, height: h };
                            }
                            return { width: size, height: size };
                        },
                    },
                    (decoded) => {
                        if (cancelled) return;
                        const cleaned = decoded.replace(/[^\d]/g, "");
                        if (cleaned.length < 8) return;
                        if (lastScannedRef.current === cleaned) return;
                        lastScannedRef.current = cleaned;

                        onScanRef.current(cleaned);
                        void stop();
                    },
                    () => {
                        // scan failures are expected
                    },
                );

                if (cancelled) return;

                try {
                    const caps = scanner.getRunningTrackCameraCapabilities();
                    if (caps?.torchFeature()?.isSupported()) setTorchSupported(true);
                } catch {
                    // torch check failed
                }
            } catch {
                if (!cancelled) {
                    setError("Nie udało się uruchomić kamery.");
                    setOpen(false);
                }
            }
        })();

        return () => {
            cancelled = true;
            try {
                void scanner.stop().catch(() => {});
            } catch {
                // scanner not started yet
            }
            scannerRef.current = null;
        };
    }, [open]);

    const toggleTorch = async () => {
        if (!scannerRef.current) return;
        const next = !torchOn;
        try {
            await scannerRef.current.applyVideoConstraints({ advanced: [{ torch: next } as unknown as MediaTrackConstraintSet] });
            setTorchOn(next);
        } catch {
            // torch not available
        }
    };

    const TorchButton = () => {
        if (!torchSupported) return null;
        return (
            <Button type="button" variant="ghost" size="icon-sm" className="absolute right-2 bottom-2 bg-white/10 text-white hover:bg-white/25" onClick={toggleTorch}>
                <HugeiconsIcon icon={torchOn ? FlashlightIcon : FlashlightOffIcon} strokeWidth={1.5} />
                <span className="sr-only">{torchOn ? "Wyłącz lampę" : "Włącz lampę"}</span>
            </Button>
        );
    };

    const Viewfinder = () => {
        if (!open) return null;
        return (
            <div className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-lg border bg-black">
                <div id="barcode-scanner" className="aspect-4/3 w-full" />
                <TorchButton />
            </div>
        );
    };

    return { open, setOpen, torchOn, torchSupported, error, stop, toggleTorch, Viewfinder } as const;
}
