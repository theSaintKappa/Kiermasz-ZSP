const priceFormatter = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
    return priceFormatter.format(Math.round(amount));
}
