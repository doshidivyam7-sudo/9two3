import { Briefcase, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortfolioTable } from "./_table";
import { AddHoldingDialog } from "./_add-holding";

export const dynamic = "force-dynamic";

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Briefcase className="h-5 w-5" /> Portfolio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track core holdings with live P&L and per-position notes.
          </p>
        </div>
        <AddHoldingDialog trigger={<Button><Plus className="h-3.5 w-3.5" /> Add holding</Button>} />
      </div>
      <Card>
        <CardHeader><CardTitle>Holdings</CardTitle></CardHeader>
        <CardContent className="p-0"><PortfolioTable /></CardContent>
      </Card>
    </div>
  );
}
