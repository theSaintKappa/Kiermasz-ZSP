const priceFormatter = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
});

export function formatPrice(amount: number): string {
    return priceFormatter.format(amount);
}
