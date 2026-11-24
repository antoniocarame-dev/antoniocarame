import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const variantes = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:brightness-110",
        outline: "border border-input bg-card hover:border-primary hover:text-primary-ink",
        ghost: "hover:bg-muted",
        destructive: "border border-input bg-card text-bad hover:border-bad",
      },
      size: { default: "h-9 px-3.5", sm: "h-8 px-2.5 text-[13px]", icon: "size-8" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({ className, variant, size, asChild, ...props }:
  React.ComponentProps<"button"> & VariantProps<typeof variantes> & { asChild?: boolean }) {
  const C = asChild ? Slot : "button";
  return <C className={cn(variantes({ variant, size }), className)} {...props} />;
}
