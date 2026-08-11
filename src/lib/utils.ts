import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Unwinds accidental multi-level percent-encoding on a dynamic route param.
 *
 * Next.js has a known bug where client-side navigation can double-encode
 * path segments that already contain a "%" (see
 * https://github.com/vercel/next.js/issues/93491) - e.g. an artnr like
 * "100%.1009020BL" arrives as "100%2525.1009020BL" instead of
 * "100%.1009020BL". Decoding repeatedly until it stabilizes (or a decode
 * fails, meaning we've hit the real value) recovers the original value
 * regardless of how many extra encoding layers were applied.
 */
export function normalizeRouteParam(value: string): string {
  let result = value;
  for (let i = 0; i < 5; i++) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(result);
    } catch {
      break;
    }
    if (decoded === result) break;
    result = decoded;
  }
  return result;
}
