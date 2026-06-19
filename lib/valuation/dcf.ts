// Two-stage DCF: explicit forecast horizon + terminal value (Gordon growth).
// All amounts in INR Cr; returns per-share intrinsic value in INR.

export interface DCFAssumptions {
  // Latest TTM/FY revenue in Cr
  baseRevenueCr: number;
  // Period-by-period assumptions (length = horizonYears)
  // Each entry is a real growth rate; e.g. 0.15 for 15%
  revenueGrowth: number[];
  // EBITDA margin per period (constant or per-year)
  ebitdaMargin: number | number[];
  // D&A as % of revenue
  daPctOfRevenue: number;
  // Tax rate, e.g. 0.25
  taxRate: number;
  // Capex as % of revenue
  capexPctOfRevenue: number;
  // Working-capital investment as % of incremental revenue
  workingCapitalPctOfIncRev: number;
  // WACC, e.g. 0.12
  wacc: number;
  // Terminal growth rate, e.g. 0.04
  terminalGrowth: number;
  // Net debt today, INR Cr (debt minus cash & equivalents)
  netDebtCr: number;
  // Diluted share count (Cr)
  sharesOutstandingCr: number;
  // Optional minority interest, preferred capital, ESOP overhang etc.
  minorityInterestCr?: number;
}

export interface DCFYearResult {
  year: number;
  revenueCr: number;
  ebitdaCr: number;
  daCr: number;
  ebitCr: number;
  noplatCr: number;
  capexCr: number;
  wcInvestmentCr: number;
  fcffCr: number;
  discountFactor: number;
  pvFcffCr: number;
}

export interface DCFResult {
  assumptions: DCFAssumptions;
  schedule: DCFYearResult[];
  terminalValueCr: number;
  pvTerminalValueCr: number;
  enterpriseValueCr: number;
  equityValueCr: number;
  intrinsicValuePerShare: number;
  impliedExitMultiple: number;
  sensitivity: {
    wacc: number;
    terminalGrowth: number;
    intrinsicValuePerShare: number;
  }[];
}

function marginAt(margin: number | number[], idx: number): number {
  return Array.isArray(margin) ? margin[Math.min(idx, margin.length - 1)] : margin;
}

export function runDCF(a: DCFAssumptions): DCFResult {
  if (a.wacc <= a.terminalGrowth) {
    throw new Error("WACC must exceed terminal growth rate.");
  }
  if (a.sharesOutstandingCr <= 0) {
    throw new Error("Share count must be positive.");
  }

  const horizon = a.revenueGrowth.length;
  let prevRevenue = a.baseRevenueCr;
  const schedule: DCFYearResult[] = [];

  for (let i = 0; i < horizon; i++) {
    const year = i + 1;
    const revenue = prevRevenue * (1 + a.revenueGrowth[i]);
    const ebitdaMargin = marginAt(a.ebitdaMargin, i);
    const ebitda = revenue * ebitdaMargin;
    const da = revenue * a.daPctOfRevenue;
    const ebit = ebitda - da;
    const noplat = ebit * (1 - a.taxRate);
    const capex = revenue * a.capexPctOfRevenue;
    const incRevenue = revenue - prevRevenue;
    const wcInvestment = incRevenue * a.workingCapitalPctOfIncRev;
    // FCFF = NOPLAT + D&A - Capex - ΔWC
    const fcff = noplat + da - capex - wcInvestment;
    const discountFactor = 1 / Math.pow(1 + a.wacc, year);
    const pvFcff = fcff * discountFactor;

    schedule.push({
      year,
      revenueCr: revenue,
      ebitdaCr: ebitda,
      daCr: da,
      ebitCr: ebit,
      noplatCr: noplat,
      capexCr: capex,
      wcInvestmentCr: wcInvestment,
      fcffCr: fcff,
      discountFactor,
      pvFcffCr: pvFcff,
    });
    prevRevenue = revenue;
  }

  const last = schedule[schedule.length - 1];
  // Terminal value at year H using FCFF * (1 + g) / (WACC - g)
  const terminalFcff = last.fcffCr * (1 + a.terminalGrowth);
  const terminalValueCr = terminalFcff / (a.wacc - a.terminalGrowth);
  const pvTerminalValueCr = terminalValueCr / Math.pow(1 + a.wacc, horizon);

  const sumPvFcff = schedule.reduce((s, r) => s + r.pvFcffCr, 0);
  const enterpriseValueCr = sumPvFcff + pvTerminalValueCr;
  const equityValueCr =
    enterpriseValueCr - (a.netDebtCr ?? 0) - (a.minorityInterestCr ?? 0);
  const intrinsicValuePerShare = equityValueCr / a.sharesOutstandingCr;
  const impliedExitMultiple = terminalValueCr / last.ebitdaCr;

  return {
    assumptions: a,
    schedule,
    terminalValueCr,
    pvTerminalValueCr,
    enterpriseValueCr,
    equityValueCr,
    intrinsicValuePerShare,
    impliedExitMultiple,
    sensitivity: buildSensitivity(a),
  };
}

function buildSensitivity(base: DCFAssumptions) {
  const out: DCFResult["sensitivity"] = [];
  const waccs = [-0.02, -0.01, 0, 0.01, 0.02].map((d) => base.wacc + d);
  const grs = [-0.01, 0, 0.01].map((d) => base.terminalGrowth + d);
  for (const w of waccs) {
    for (const g of grs) {
      if (w <= g) continue;
      const r = runOnce({ ...base, wacc: w, terminalGrowth: g });
      out.push({ wacc: w, terminalGrowth: g, intrinsicValuePerShare: r });
    }
  }
  return out;
}

function runOnce(a: DCFAssumptions): number {
  // lightweight version used for sensitivity to avoid infinite recursion
  let prevRevenue = a.baseRevenueCr;
  let sumPv = 0;
  let lastFcff = 0;
  for (let i = 0; i < a.revenueGrowth.length; i++) {
    const year = i + 1;
    const revenue = prevRevenue * (1 + a.revenueGrowth[i]);
    const ebitda = revenue * marginAt(a.ebitdaMargin, i);
    const da = revenue * a.daPctOfRevenue;
    const ebit = ebitda - da;
    const noplat = ebit * (1 - a.taxRate);
    const capex = revenue * a.capexPctOfRevenue;
    const incRevenue = revenue - prevRevenue;
    const wc = incRevenue * a.workingCapitalPctOfIncRev;
    const fcff = noplat + da - capex - wc;
    sumPv += fcff / Math.pow(1 + a.wacc, year);
    lastFcff = fcff;
    prevRevenue = revenue;
  }
  const tv = (lastFcff * (1 + a.terminalGrowth)) / (a.wacc - a.terminalGrowth);
  const pvTv = tv / Math.pow(1 + a.wacc, a.revenueGrowth.length);
  const equity = sumPv + pvTv - (a.netDebtCr ?? 0) - (a.minorityInterestCr ?? 0);
  return equity / a.sharesOutstandingCr;
}

export function defaultAssumptionsFromFundamentals(opts: {
  baseRevenueCr: number;
  ebitdaMargin: number;
  netDebtCr: number;
  sharesOutstandingCr: number;
  growthGuess?: number;
}): DCFAssumptions {
  const g = opts.growthGuess ?? 0.12;
  return {
    baseRevenueCr: opts.baseRevenueCr,
    revenueGrowth: [g, g, g * 0.9, g * 0.8, g * 0.7, g * 0.6, g * 0.5, 0.07, 0.06, 0.05],
    ebitdaMargin: opts.ebitdaMargin,
    daPctOfRevenue: 0.04,
    taxRate: 0.252,
    capexPctOfRevenue: 0.06,
    workingCapitalPctOfIncRev: 0.12,
    wacc: 0.12,
    terminalGrowth: 0.04,
    netDebtCr: opts.netDebtCr,
    sharesOutstandingCr: opts.sharesOutstandingCr,
  };
}
