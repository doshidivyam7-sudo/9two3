"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  ShieldCheck,
  Briefcase,
  Eye,
  Settings,
  TrendingUp,
  FileText,
  Filter,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/research", label: "Company Research", icon: LineChart },
      { href: "/screener", label: "Screener", icon: Filter },
      { href: "/compare", label: "Compare", icon: Scale },
      { href: "/watchlist", label: "Watchlist", icon: Eye },
      { href: "/portfolio", label: "Portfolio", icon: Briefcase },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/thesis-monitor", label: "Thesis Monitor", icon: ShieldCheck, badge: "TM" },
      { href: "/notes", label: "Research Notes", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-sm font-semibold tracking-tight">
          Stock Research <span className="text-muted-foreground">Copilot</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-6">
            <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      {"badge" in item && item.badge && (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <div className="rounded-md border border-border bg-background/40 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Thesis Monitor™
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Track every active investment thesis against results, news, and concall commentary.
          </p>
        </div>
      </div>
    </aside>
  );
}
