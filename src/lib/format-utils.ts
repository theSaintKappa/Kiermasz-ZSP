const priceFormatter = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
    return priceFormatter.format(Math.round(amount));
}

const dateTimeFormatter = new Intl.DateTimeFormat("pl-PL", { dateStyle: "long", timeStyle: "short" });

export function formatDateTime(iso: string): string {
    return dateTimeFormatter.format(new Date(iso));
}
