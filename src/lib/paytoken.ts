import { createHmac, timingSafeEqual } from "crypto";

/**
 * Capability tokens for client-facing invoice payment links.
 * Anyone holding a valid link can VIEW one invoice — no portal login needed.
 */

export function signPayToken(invoiceId: number): string {
  const secret = process.env.JWT_SECRET || "visionfold-dev-secret-rotate-in-prod";
  return createHmac("sha256", secret).update(`pay:${invoiceId}`).digest("hex").slice(0, 32);
}

export function verifyPayToken(invoiceId: number, token: string | null): boolean {
  if (!token) return false;
  const expected = signPayToken(invoiceId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function payLink(invoiceId: number): string {
  const base = (process.env.APP_URL || "").replace(/\/$/, "");
  return `${base}/pay/${invoiceId}?t=${signPayToken(invoiceId)}`;
}
