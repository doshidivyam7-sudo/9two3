// Indian-locale aware formatters used across the app.

const inrCrFmt = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const inrFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const inrIntFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactFmt = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 2,
});

/** Format Indian rupee amount expressed in crore (e.g. 12,345). */
export function fmtCr(value: number | null | undefined, suffix = " Cr"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `₹${inrCrFmt.format(value)}${suffix}`;
}

/** Format raw INR amount. */
export function fmtINR(value: number | null | undefined, opts?: { decimals?: boolean }): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return (opts?.decimals ? inrFmt : inrIntFmt).format(value);
}

/** Format absolute number with compact notation (e.g. 1.2 Cr). */
export function fmtCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return compactFmt.format(value);
}

/** Percentage from a ratio (0.123 -> "12.3%"). */
export function fmtPct(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Percentage from a percentage value (12.3 -> "12.3%"). */
export function fmtPctValue(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(decimals)}%`;
}

/** Plain number with thousand separators. */
export function fmtNum(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
}

/** Compute CAGR from first and last values. */
export function cagr(start: number, end: number, years: number): number | null {
  if (!start || !end || years <= 0) return null;
  if (start < 0 || end < 0) return null;
  return Math.pow(end / start, 1 / years) - 1;
}

/** Compute YoY delta as ratio (0.12 = +12%). */
export function yoy(current: number, prior: number): number | null {
  if (!prior) return null;
  return (current - prior) / Math.abs(prior);
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "2-digit" }).format(date);
}
