"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtCompact, fmtPct } from "@/lib/format";

interface TrendPoint {
  fiscalYear: number;
  [key: string]: number | string | null | undefined;
}

interface Props {
  data: TrendPoint[];
  series: { key: string; label: string; color?: string; isPercent?: boolean; type?: "bar" | "line" | "area" }[];
  height?: number;
  formatY?: "number" | "percent";
  title?: string;
}

const DEFAULT_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(158, 64%, 50%)",
  "hsl(38, 92%, 60%)",
  "hsl(280, 73%, 60%)",
  "hsl(0, 84%, 60%)",
];

export function FinancialTrend({ data, series, height = 240, formatY = "number" }: Props) {
  const yFormatter = (v: number) => (formatY === "percent" ? fmtPct(v) : fmtCompact(v));

  // If all series are area/line we use AreaChart; if mixed with bars, use ComposedChart-style via BarChart.
  const allBars = series.every((s) => s.type === "bar");
  const allLines = series.every((s) => !s.type || s.type === "line" || s.type === "area");

  if (allBars) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="fiscalYear" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={yFormatter} axisLine={false} tickLine={false} width={48} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}
            formatter={(v: any) => yFormatter(Number(v))}
          />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />}
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (allLines) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s, i) => {
              const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
              return (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="fiscalYear" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={yFormatter} axisLine={false} tickLine={false} width={48} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}
            formatter={(v: any) => yFormatter(Number(v))}
          />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />}
          {series.map((s, i) => {
            const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            if (s.type === "line") {
              return <Line key={s.key} dataKey={s.key} name={s.label} stroke={color} strokeWidth={2} dot={false} />;
            }
            return <Area key={s.key} dataKey={s.key} name={s.label} stroke={color} strokeWidth={2} fill={`url(#grad-${s.key})`} />;
          })}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="fiscalYear" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <YAxis tickFormatter={yFormatter} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => yFormatter(Number(v))} />
        {series.map((s, i) => (
          <Line key={s.key} dataKey={s.key} name={s.label} stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  padding: 8,
  color: "hsl(var(--popover-foreground))",
};
