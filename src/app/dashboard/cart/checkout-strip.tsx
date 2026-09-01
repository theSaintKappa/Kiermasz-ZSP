"use client";

import { ArrowLeft02Icon, CheckmarkCircle02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { formatPrice } from "@/lib/format-utils";

const DENOMINATIONS = [1, 2, 5, 10, 20, 50, 100, 200];

function parseAmount(s: string): number | null {
    const cleaned = s.trim().replace(",", ".");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? n : null;
}

function toPaymentString(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
}

interface CheckoutStripProps {
    total: number;
    isSelling: boolean;
    hasConflicts: boolean;
    onConfirm: () => void;
    onBack: () => void;
}

export function CheckoutStrip({ total, isSelling, hasConflicts, onConfirm, onBack }: CheckoutStripProps) {
    const [payment, setPayment] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const paid = parseAmount(payment);
    const change = paid !== null ? Math.round((paid - total) * 100) / 100 : null;
    const underpaid = change !== null && change < 0;
    const canConfirm = !isSelling && !hasConflicts && !underpaid;

    const addDenomination = (d: number) => {
        setPayment(toPaymentString((paid ?? 0) + d));
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col gap-2 p-3">
            <span className="font-semibold">Kalkulator reszty</span>

            <div className="flex items-center gap-3">
                <InputGroup className="w-16">
                    <InputGroupInput
                        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        type="number"
                        ref={inputRef}
                        value={payment}
                        onChange={(e) => setPayment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && canConfirm) onConfirm();
                            if (e.key === "Escape") onBack();
                        }}
                        inputMode="decimal"
                        placeholder="0"
                        aria-label="Kwota otrzymana od klienta"
                    />
                    <InputGroupAddon align="inline-end">
                        <InputGroupText>zł</InputGroupText>
                    </InputGroupAddon>
                </InputGroup>

                {/* Change display */}
                {change !== null && (underpaid ? <p className="font-medium text-base text-destructive">Brakuje: {formatPrice(Math.abs(change))}</p> : <p className="font-medium text-base text-green-600 dark:text-green-400">Reszta: {formatPrice(change)}</p>)}
            </div>

            {/* Bill chips — additive */}
            <div className="flex flex-wrap items-center gap-1.5">
                <Badge render={<Button onClick={() => setPayment(toPaymentString(total))} />}>= {total} zł</Badge>
                {DENOMINATIONS.map((d) => (
                    <Badge key={d} render={<Button variant="outline" onClick={() => addDenomination(d)} />}>
                        + {d} zł
                    </Badge>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button variant="ghost" onClick={onBack}>
                    <HugeiconsIcon icon={ArrowLeft02Icon} />
                    Wróć
                </Button>
                <Button className="flex-1" onClick={onConfirm} disabled={!canConfirm}>
                    {isSelling ? (
                        <>
                            <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
                            Sprzedawanie…
                        </>
                    ) : (
                        <>
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} />
                            Potwierdź sprzedaż
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
