"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-background border border-border text-foreground shadow-lg",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
