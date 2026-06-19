"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Error</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{error.message || "Unhandled exception."}</p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline"><Link href="/dashboard">Dashboard</Link></Button>
      </div>
    </div>
  );
}
