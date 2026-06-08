const COOKIE_NAME = "x-event-id";

export function getEventCookie(): string | null {
    if (typeof document === "undefined") return null;

    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));

    return match ? decodeURIComponent(match[1]) : null;
}

export function setEventCookie(eventId: string): void {
    // biome-ignore lint/suspicious/noDocumentCookie: cookie synced for server-side event awareness
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(eventId)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function clearEventCookie(): void {
    // biome-ignore lint/suspicious/noDocumentCookie: cookie synced for server-side event awareness
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
