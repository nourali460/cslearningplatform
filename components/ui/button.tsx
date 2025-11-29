import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-orange/20 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary - Orange accent (claude.ai style)
        default: "bg-accent-orange text-white hover:bg-accent-orange-hover shadow-sm",

        // Secondary - Subtle gray
        secondary: "bg-background-secondary text-foreground hover:bg-hover border border-border",

        // Outline - Minimal border
        outline: "border border-border bg-transparent text-foreground hover:bg-background-secondary hover:border-border-secondary",

        // Ghost - No background
        ghost: "text-foreground hover:bg-background-secondary",

        // Destructive - Red for dangerous actions
        destructive: "bg-error text-white hover:bg-error/90 shadow-sm",

        // Link - Text only
        link: "text-accent-orange underline-offset-4 hover:underline hover:text-accent-orange-hover",

        // Success - Green for positive actions
        success: "bg-success text-white hover:bg-success/90 shadow-sm",

        // Purple accent variant
        purple: "bg-accent-purple text-white hover:bg-accent-purple-hover shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 py-1.5 text-xs",
        lg: "h-12 px-6 py-3 text-base",
        xl: "h-14 px-8 py-4 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
