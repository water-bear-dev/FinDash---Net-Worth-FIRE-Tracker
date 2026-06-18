/** Base URL for the FinDash price server. Override at build time via VITE_PRICE_SERVER_URL. */
export const PRICE_SERVER_URL =
    (import.meta.env.VITE_PRICE_SERVER_URL as string | undefined)?.replace(/\/$/, '') ||
    'http://localhost:8001';

export function priceServerPath(path: string): string {
    return `${PRICE_SERVER_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
