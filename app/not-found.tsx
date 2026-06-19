import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">404</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The ticker or page you're looking for isn't available in your data provider.
      </p>
      <Button asChild className="mt-6"><Link href="/dashboard">Back to dashboard</Link></Button>
    </div>
  );
}
