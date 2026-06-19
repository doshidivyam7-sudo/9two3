"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Command as CmdIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Props {
  user?: { name?: string | null; email?: string | null };
}

export function Topbar({ user }: Props) {
  const [q, setQ] = useState("");
  const router = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = q.trim().toUpperCase();
    if (!ticker) return;
    router.push(`/research/${ticker}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <form onSubmit={onSubmit} className="relative max-w-xl flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company or NSE ticker (e.g. RELIANCE, TCS, INOXINDIA)…"
          className="h-9 pl-9 pr-16"
          autoComplete="off"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline-flex">
          <CmdIcon className="h-3 w-3" /> K
        </kbd>
      </form>
      <div className="hidden md:flex items-center gap-2">
        <Link href="/research" className="text-xs text-muted-foreground hover:text-foreground">Research</Link>
        <span className="text-xs text-muted-foreground/50">·</span>
        <Link href="/thesis-monitor" className="text-xs text-muted-foreground hover:text-foreground">Thesis Monitor</Link>
        <span className="text-xs text-muted-foreground/50">·</span>
        <Link href="/portfolio" className="text-xs text-muted-foreground hover:text-foreground">Portfolio</Link>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarFallback>
                {(user?.name ?? user?.email ?? "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="text-sm font-medium normal-case tracking-normal">{user?.name ?? "Signed in"}</div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href="/settings/api-keys">API Keys</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/api/auth/signout">Sign out</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
