import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border",
  {
    variants: {
      variant: {
        default: "border-transparent bg-blue-600/20 text-blue-400 border-blue-600/30",
        secondary: "border-transparent bg-white/10 text-white/70",
        destructive: "border-transparent bg-red-600/20 text-red-400 border-red-600/30",
        success: "border-transparent bg-green-600/20 text-green-400 border-green-600/30",
        warning: "border-transparent bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
        outline: "text-white/70 border-white/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
