import type { PeerSnapshot } from "@/lib/data/types";

export interface RelativeValuation {
  metric: "pe" | "evEbitda" | "evSales" | "pb";
  peerMedian: number;
  peerMean: number;
  companyValue: number;
  premiumDiscount: number;
  impliedPrice?: number;
}

export interface ImpliedFromRelative {
  pe?: number;
  evEbitda?: number;
  evSales?: number;
  pb?: number;
}

function median(nums: number[]): number {
  const arr = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!arr.length) return NaN;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

function mean(nums: number[]): number {
  const arr = nums.filter((n) => Number.isFinite(n));
  if (!arr.length) return NaN;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

export function summarizeRelative(
  company: { pe?: number; evEbitda?: number; evSales?: number; pb?: number },
  peers: PeerSnapshot[],
): RelativeValuation[] {
  const fields: { key: keyof RelativeValuation extends never ? never : "pe" | "evEbitda" | "evSales" | "pb" }[] = [
    { key: "pe" },
    { key: "evEbitda" },
    { key: "evSales" },
    { key: "pb" },
  ];
  return fields.map(({ key }) => {
    const peerVals = peers.map((p) => p[key]).filter((n): n is number => typeof n === "number");
    const peerMed = median(peerVals);
    const peerAvg = mean(peerVals);
    const companyVal = company[key] ?? NaN;
    return {
      metric: key,
      peerMedian: peerMed,
      peerMean: peerAvg,
      companyValue: companyVal,
      premiumDiscount: companyVal && peerMed ? companyVal / peerMed - 1 : NaN,
    };
  });
}

export function impliedPriceFromMultiples(
  base: {
    eps?: number;
    ebitdaPerSharePost: number;
    salesPerShare: number;
    bookValuePerShare: number;
    netDebtPerShare: number;
  },
  peerMultiples: ImpliedFromRelative,
) {
  const out: Record<string, number | undefined> = {};
  if (peerMultiples.pe && base.eps) out.pe = peerMultiples.pe * base.eps;
  if (peerMultiples.evEbitda)
    out.evEbitda = peerMultiples.evEbitda * base.ebitdaPerSharePost - base.netDebtPerShare;
  if (peerMultiples.evSales)
    out.evSales = peerMultiples.evSales * base.salesPerShare - base.netDebtPerShare;
  if (peerMultiples.pb) out.pb = peerMultiples.pb * base.bookValuePerShare;
  return out;
}
