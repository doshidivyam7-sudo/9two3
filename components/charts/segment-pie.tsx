"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Segment {
  name: string;
  value: number;
}

interface Props {
  data: Segment[];
  height?: number;
}

const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(158, 64%, 50%)",
  "hsl(38, 92%, 60%)",
  "hsl(280, 73%, 60%)",
  "hsl(0, 84%, 60%)",
  "hsl(180, 70%, 50%)",
  "hsl(45, 95%, 55%)",
];

export function SegmentPie({ data, height = 200 }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" stroke="hsl(var(--background))" strokeWidth={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
            padding: 8,
            color: "hsl(var(--popover-foreground))",
          }}
          formatter={(value: any, name) => [`${((Number(value) / total) * 100).toFixed(1)}%`, name]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
