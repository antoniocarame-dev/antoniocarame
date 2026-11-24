import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = ({ className, ...p }: React.ComponentProps<"div">) =>
  <div className={cn("rounded-md border bg-card p-5 min-w-0", className)} {...p} />;
export const CardHeader = ({ className, ...p }: React.ComponentProps<"div">) =>
  <div className={cn("mb-4 flex flex-wrap items-center justify-between gap-2", className)} {...p} />;
export const CardTitle = ({ className, ...p }: React.ComponentProps<"h2">) =>
  <h2 className={cn("font-mono text-[15px] font-bold tracking-tight", className)} {...p} />;
