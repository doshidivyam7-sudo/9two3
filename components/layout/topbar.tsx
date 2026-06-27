"use client";

import Link from "next/link";
import { Search, Command as CmdIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCommandPalette } from "@/components/command-palette/command-palette";

interface Props {
  user?: { name?: string | null; email?: string | null };
}

export function Topbar({ user }: Props) {
  const openPalette = useCommandPalette((s) => s.setOpen);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <button
        type="button"
        onClick={() => openPalette(true)}
        aria-label="Open command palette"
        className="group relative flex h-9 max-w-xl flex-1 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:border-foreground/30 hover:text-foreground/80"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 truncate">Search ticker, page, or action…</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline-flex">
          <CmdIcon className="h-3 w-3" /> K
        </kbd>
      </button>
      <div className="hidden md:flex items-center gap-2">
        <Link href="/screener" className="text-xs text-muted-foreground hover:text-foreground">Screener</Link>
        <span className="text-xs text-muted-foreground/50">·</span>
        <Link href="/compare" className="text-xs text-muted-foreground hover:text-foreground">Compare</Link>
        <span className="text-xs text-muted-foreground/50">·</span>
        <Link href="/thesis-monitor" className="text-xs text-muted-foreground hover:text-foreground">Thesis Monitor</Link>
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
