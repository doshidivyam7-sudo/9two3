import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground border-border",
        bull: "border-transparent bg-[hsl(var(--bull))]/15 text-[hsl(var(--bull))]",
        bear: "border-transparent bg-[hsl(var(--bear))]/15 text-[hsl(var(--bear))]",
        warn: "border-transparent bg-[hsl(var(--warn))]/15 text-[hsl(var(--warn))]",
        info: "border-transparent bg-[hsl(var(--info))]/15 text-[hsl(var(--info))]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
