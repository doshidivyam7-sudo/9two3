"use client";

import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { fmtCompact, fmtPct } from "@/lib/format";

interface Series {
  key: string;
  label: string;
  color: string;
}

interface Props {
  data: Record<string, any>[];
  series: Series[];
  height?: number;
  formatY?: "number" | "percent";
}

const tooltipStyle: React.CSSProperties = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  padding: 8,
  color: "hsl(var(--popover-foreground))",
};

export function OverlayLineChart({ data, series, height = 280, formatY = "number" }: Props) {
  const yFormatter = (v: number) => (formatY === "percent" ? fmtPct(v) : fmtCompact(v));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="fiscalYear" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={yFormatter}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}
          formatter={(v: any) => (typeof v === "number" ? yFormatter(v) : v)}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
