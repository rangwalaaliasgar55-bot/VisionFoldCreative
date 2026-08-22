/**
 * INR-first money helpers.
 *
 * Studio default is Indian Rupees. If a client quotes or pays in USD (or
 * another currency) we convert to INR, keep the original amount + currency,
 * and always display the ₹ figure.
 *
 * FX_USD_INR is a documented studio rate (override with FX_USD_INR env).
 * It is intentionally simple — no live API dependency — so invoices stay
 * reproducible. Update the env var when you want a new working rate.
 */
export const STUDIO_CURRENCY = "INR";
export const FX_USD_INR = Number(process.env.FX_USD_INR || 83.5);

const FX: Record<string, number> = {
  INR: 1,
  USD: FX_USD_INR,
  EUR: FX_USD_INR * 1.08,
  GBP: FX_USD_INR * 1.27,
  AED: FX_USD_INR / 3.67,
};

export type MoneyInput = {
  amount: number;
  currency?: string;
};

export type StoredMoney = {
  amountInr: number;
  currency: string;
  originalAmount: number;
  originalCurrency: string;
  fxRate: number;
};

export function normalizeCurrency(raw: unknown): string {
  const c = String(raw || "INR").trim().toUpperCase();
  if (c === "RS" || c === "RUPEE" || c === "RUPEES" || c === "₹") return "INR";
  if (c === "$" || c === "DOLLAR" || c === "DOLLARS") return "USD";
  return c.slice(0, 8) || "INR";
}

export function fxToInr(currency: string): number {
  const c = normalizeCurrency(currency);
  return FX[c] ?? FX_USD_INR;
}

export function toInr(input: MoneyInput): StoredMoney {
  const currency = normalizeCurrency(input.currency);
  const originalAmount = Number.isFinite(input.amount) ? input.amount : 0;
  const fxRate = fxToInr(currency);
  const amountInr = currency === "INR" ? originalAmount : Math.round(originalAmount * fxRate);
  return {
    amountInr,
    currency: "INR",
    originalAmount,
    originalCurrency: currency,
    fxRate: currency === "INR" ? 1 : fxRate,
  };
}

export function fmtInr(n: number | string | null | undefined): string {
  const v = Number(n);
  const amount = Number.isFinite(v) ? v : 0;
  return amount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export function fmtOriginal(amount: number, currency: string): string {
  const c = normalizeCurrency(currency);
  try {
    return amount.toLocaleString(c === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: c,
      maximumFractionDigits: c === "INR" ? 0 : 2,
    });
  } catch {
    return `${c} ${amount}`;
  }
}

/** Display line: always ₹, plus original if it wasn't INR. */
export function fmtMoneyLine(stored: Partial<StoredMoney> & { amountInr?: number; amount?: number }): string {
  const inr = stored.amountInr ?? stored.amount ?? 0;
  const originalCurrency = stored.originalCurrency || "INR";
  if (!originalCurrency || originalCurrency === "INR") return fmtInr(inr);
  return `${fmtInr(inr)} (${fmtOriginal(Number(stored.originalAmount || 0), originalCurrency)})`;
}

export function parseMoneyString(raw: string): MoneyInput {
  const text = String(raw || "").trim();
  const currency = /\$|usd/i.test(text) ? "USD" : /€|eur/i.test(text) ? "EUR" : /£|gbp/i.test(text) ? "GBP" : "INR";
  const amount = Number(text.replace(/[^0-9.]/g, ""));
  return { amount: Number.isFinite(amount) ? amount : 0, currency };
}
