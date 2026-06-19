import { Settings, KeyRound, Database, Cpu } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PreferencesForm } from "./_preferences";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const prefs = await prisma.userPreferences.upsert({
    where: { userId: session!.user.id },
    update: {},
    create: { userId: session!.user.id },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Settings className="h-5 w-5" /> Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your workspace and AI provider preferences.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Cpu className="h-3.5 w-3.5" /> AI provider</CardTitle></CardHeader>
        <CardContent><PreferencesForm prefs={prefs} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-3.5 w-3.5" /> Market data</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Active provider" value={process.env.MARKET_DATA_PROVIDER ?? "mock"} />
          <Row label="Supported" value="NSE · BSE · FMP · Alpha Vantage · Polygon" />
          <Separator />
          <p className="text-xs text-muted-foreground">
            Set <code className="text-foreground">MARKET_DATA_PROVIDER</code> in your environment and provide the matching API key
            to switch providers. The data layer is fully abstracted — providers can be swapped without UI changes.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-3.5 w-3.5" /> API keys</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Sensitive keys (LLM providers, market data) live in environment variables, not in the database.
            Per-user keys can be encrypted and persisted to <code className="text-foreground">UserApiKey</code> — wire your KMS in
            <code className="text-foreground">lib/auth.ts</code> before turning this on.
          </p>
          <div className="rounded-md border border-border bg-background/40 p-3">
            <Row label="ANTHROPIC_API_KEY" value={env("ANTHROPIC_API_KEY")} />
            <Row label="OPENAI_API_KEY" value={env("OPENAI_API_KEY")} />
            <Row label="FMP_API_KEY" value={env("FMP_API_KEY")} />
            <Row label="ALPHA_VANTAGE_API_KEY" value={env("ALPHA_VANTAGE_API_KEY")} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 text-xs">
      <span className="font-mono text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function env(name: string) {
  return process.env[name] ? "✓ configured" : "— not configured";
}
