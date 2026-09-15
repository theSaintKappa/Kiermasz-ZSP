"use client";

import { PrinterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-utils";
import type { PayoutItemRow, PayoutSellerRow } from "./payouts-utils";
import { formatReceiptNumber } from "./payouts-utils";

interface PayoutReceiptProps {
    seller: PayoutSellerRow;
    payout: NonNullable<PayoutSellerRow["payout"]>;
}

const LEGAL_TEXT =
    "Niniejszy dokument potwierdza otrzymanie przez Sprzedawcę kwoty wskazanej powyżej, stanowiącej należność za podręczniki sprzedane w ramach kiermaszu, oraz zwrot podręczników niesprzedanych w liczbie wskazanej powyżej. Sprzedawca oświadcza, że otrzymał należność w pełnej wysokości i nie zgłasza do niej żadnych zastrzeżeń. Rozliczenie następuje bez potrącania prowizji ani opłat, zgodnie z regulaminem kiermaszu. Dokument sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze stron.";

export function PayoutReceipt({ seller, payout }: PayoutReceiptProps) {
    return (
        <div data-slot="payout-receipt" className="flex flex-col gap-4 bg-white p-6 text-neutral-900">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    {/* biome-ignore lint/performance/noImgElement: plain img for print reliability - no dangerouslyAllowSVG in next.config */}
                    <img src="/logo.svg" alt="Kiermasz ZSP" className="h-10 w-auto" />
                </div>
                <div className="flex flex-col items-end text-right">
                    <div>
                        <span className="font-bold text-lg">Potwierdzenie wypłaty</span> <span className="font-mono text-neutral-600 text-sm">{formatReceiptNumber(payout.receiptNumber)}</span>
                    </div>
                    <span className="text-neutral-500 text-xs">
                        {new Date(payout.paidAt).toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" })}
                        {", "}
                        {new Date(payout.paidAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                </div>
            </div>

            {/* Seller + payout summary */}
            <div className="grid grid-cols-2 gap-4 rounded-md border border-neutral-200 p-4">
                <div>
                    <div className="text-neutral-500 text-xs">Sprzedawca</div>
                    <div>
                        <span className="font-semibold">
                            {seller.firstName} {seller.lastName}
                        </span>{" "}
                        <span className="text-neutral-600 text-sm">{seller.classSymbol}</span>
                    </div>
                </div>
                <div>
                    <div className="text-neutral-500 text-xs">Administrator</div>
                    <div className="font-semibold">{payout.adminName ?? "—"}</div>
                </div>
                <div>
                    <div className="text-neutral-500 text-xs">Wypłacono</div>
                    <div className="font-bold">{formatPrice(payout.amount)}</div>
                </div>
                <div>
                    <div className="text-neutral-500 text-xs">Zwrócono podręczników</div>
                    <div className="font-semibold">{payout.returnedCount} szt.</div>
                </div>
            </div>

            {/* Sold items */}
            <div>
                <div className="mb-2 font-semibold text-sm">Podręczniki sprzedane ({seller.soldItems.length})</div>
                {seller.soldItems.length > 0 ? (
                    <table className="w-full border-collapse text-xs">
                        <thead>
                            <tr className="border-neutral-300 border-b text-left text-neutral-600 text-xs">
                                <th className="w-8 pb-1 font-medium">Lp.</th>
                                <th className="pb-1 font-medium">Tytuł</th>
                                <th className="pb-1 font-medium">ISBN</th>
                                <th className="w-10 pb-1 text-right font-medium">Cena</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {seller.soldItems.map((item, i) => (
                                <SoldItemRow key={item.itemId} item={item} index={i + 1} />
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-neutral-300 border-t font-semibold">
                                <td colSpan={3} className="pt-1">
                                    Suma
                                </td>
                                <td className="pt-1 text-right">{formatPrice(seller.owedTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                ) : (
                    <p className="text-neutral-500 text-sm">Brak sprzedanych podręczników.</p>
                )}
            </div>

            {/* Unsold items */}
            <div>
                <div className="mb-2 font-semibold text-sm">Podręczniki zwrócone ({seller.unsoldItems.length})</div>
                {seller.unsoldItems.length > 0 ? (
                    <table className="w-full border-collapse text-xs">
                        <thead>
                            <tr className="border-neutral-300 border-b text-left text-neutral-600 text-xs">
                                <th className="w-8 pb-1 font-medium">Lp.</th>
                                <th className="pb-1 font-medium">Tytuł</th>
                                <th className="pb-1 font-medium">ISBN</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 border-neutral-300 border-b">
                            {seller.unsoldItems.map((item, i) => (
                                <UnsoldItemRow key={item.itemId} item={item} index={i + 1} />
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-neutral-500 text-sm">Brak zwróconych podręczników.</p>
                )}
            </div>

            {/* Legal text */}
            <p className="text-neutral-500 text-xs leading-relaxed">{LEGAL_TEXT}</p>

            {/* Signatures */}
            <div data-slot="payout-signatures" className="mt-4 grid grid-cols-2 gap-8 pt-8">
                <div className="flex flex-col items-center gap-1">
                    <div className="h-px w-full bg-neutral-400" />
                    <span className="text-neutral-600 text-xs">Sprzedawca</span>
                    <span className="font-medium text-xs">
                        {seller.firstName} {seller.lastName}
                    </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="h-px w-full bg-neutral-400" />
                    <span className="text-neutral-600 text-xs">Administrator</span>
                    <span className="font-medium text-xs">{payout.adminName ?? "\u00A0"}</span>
                </div>
            </div>

            {/* Print button — hidden in print */}
            <div className="print:hidden">
                <Button onClick={() => window.print()} className="w-full">
                    <HugeiconsIcon icon={PrinterIcon} />
                    Drukuj / Zapisz PDF
                </Button>
            </div>
        </div>
    );
}

function SoldItemRow({ item, index }: { item: PayoutItemRow; index: number }) {
    return (
        <tr className="break-inside-avoid">
            <td className="py-1 text-neutral-500">{index}.</td>
            <td className="py-1">
                <span>{item.title}</span>
                {item.subtitle && <span className="ml-1 text-neutral-500">— {item.subtitle}</span>}
            </td>
            <td className="py-1 font-mono text-neutral-600 text-xs">{item.isbn}</td>
            <td className="py-1 text-right">{formatPrice(item.soldPrice ?? 0)}</td>
        </tr>
    );
}

function UnsoldItemRow({ item, index }: { item: PayoutItemRow; index: number }) {
    return (
        <tr className="break-inside-avoid">
            <td className="py-1 text-neutral-500">{index}.</td>
            <td className="py-1">
                <span>{item.title}</span>
                {item.subtitle && <span className="ml-1 text-neutral-500">— {item.subtitle}</span>}
                {item.status === "reserved" && <span className="ml-1 text-neutral-400 text-xs">(zarezerwowany)</span>}
            </td>
            <td className="py-1 font-mono text-neutral-600 text-xs">{item.isbn}</td>
        </tr>
    );
}
