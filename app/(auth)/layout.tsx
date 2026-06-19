import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 terminal-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-sm font-semibold tracking-tight">
          <div className="h-6 w-6 rounded bg-primary/15 ring-1 ring-primary/30" />
          Stock Research Copilot
        </Link>
        <div className="rounded-xl border border-border bg-card p-6 shadow-lg">{children}</div>
      </div>
    </div>
  );
}
