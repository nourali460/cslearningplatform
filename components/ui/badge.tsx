import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-orange/20 focus:ring-offset-1",
  {
    variants: {
      variant: {
        // Default - Subtle gray
        default: "bg-background-secondary text-foreground-secondary border border-border",

        // Orange accent
        orange: "bg-accent-orange/10 text-accent-orange border border-accent-orange/20",

        // Purple accent
        purple: "bg-accent-purple/10 text-accent-purple border border-accent-purple/20",

        // Success - Green
        success: "bg-success/10 text-success border border-success/20",

        // Warning - Orange/Yellow
        warning: "bg-warning/10 text-warning border border-warning/20",

        // Error - Red
        error: "bg-error/10 text-error border border-error/20",

        // Info - Blue
        info: "bg-info/10 text-info border border-info/20",

        // Outline
        outline: "border border-border text-foreground-secondary bg-transparent",

        // Solid variants
        "solid-orange": "bg-accent-orange text-white",
        "solid-purple": "bg-accent-purple text-white",
        "solid-success": "bg-success text-white",
        "solid-error": "bg-error text-white",
        "solid-info": "bg-info text-white",
        "solid-warning": "bg-warning text-white",

        // Elegant letter grade badges
        "grade": "min-w-[3rem] justify-center font-bold text-base px-3 py-1.5 rounded-lg shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
