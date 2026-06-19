import Link from "next/link";
import type { PeerSnapshot } from "@/lib/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtCr, fmtNum, fmtPctValue } from "@/lib/format";

interface Props {
  peers: PeerSnapshot[];
  self: string;
}

export function PeersSection({ peers, self }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Peer set</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Ticker</th>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-right font-medium">Mkt cap (Cr)</th>
              <th className="px-4 py-2 text-right font-medium">PE</th>
              <th className="px-4 py-2 text-right font-medium">EV/EBITDA</th>
              <th className="px-4 py-2 text-right font-medium">EV/Sales</th>
              <th className="px-4 py-2 text-right font-medium">PB</th>
              <th className="px-4 py-2 text-right font-medium">ROCE</th>
              <th className="px-4 py-2 text-right font-medium">EBITDA mgn</th>
            </tr>
          </thead>
          <tbody>
            {peers.map((p) => (
              <tr key={p.ticker} className="border-b border-border/60 last:border-b-0 hover:bg-accent/30">
                <td className="px-4 py-2 font-mono text-xs font-semibold">
                  <Link href={`/research/${p.ticker}`} className="hover:underline">{p.ticker}</Link>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{p.name}</td>
                <td className="px-4 py-2 text-right num">{p.marketCapCr ? fmtCr(p.marketCapCr, "") : "—"}</td>
                <td className="px-4 py-2 text-right num">{p.pe ? fmtNum(p.pe, 1) : "—"}</td>
                <td className="px-4 py-2 text-right num">{p.evEbitda ? fmtNum(p.evEbitda, 1) : "—"}</td>
                <td className="px-4 py-2 text-right num">{p.evSales ? fmtNum(p.evSales, 1) : "—"}</td>
                <td className="px-4 py-2 text-right num">{p.pb ? fmtNum(p.pb, 1) : "—"}</td>
                <td className="px-4 py-2 text-right num">{p.roce ? fmtPctValue(p.roce * 100) : "—"}</td>
                <td className="px-4 py-2 text-right num">{p.ebitdaMargin ? fmtPctValue(p.ebitdaMargin * 100) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
