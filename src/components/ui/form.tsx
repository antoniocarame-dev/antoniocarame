import * as React from "react";
import { cn } from "@/lib/utils";

const base = "w-full min-w-0 rounded-sm border border-input bg-card px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

export const Input = ({ className, ...p }: React.ComponentProps<"input">) => <input className={cn(base, "h-9", className)} {...p} />;
export const Textarea = ({ className, ...p }: React.ComponentProps<"textarea">) => <textarea className={cn(base, "min-h-20 leading-relaxed", className)} {...p} />;
export function Select({ className, opciones, vacio, ...p }: React.ComponentProps<"select"> & { opciones: [string, string][]; vacio?: string }) {
  return (
    <select className={cn(base, "h-9 pr-7", className)} {...p}>
      {vacio !== undefined && <option value="">{vacio}</option>}
      {opciones.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
export function Campo({ label, children, className, ayuda }: { label: string; children: React.ReactNode; className?: string; ayuda?: string }) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1 text-[12.5px] font-medium text-muted-foreground", className)}>
      {label}
      {children}
      {ayuda && <span className="text-[11.5px] font-normal">{ayuda}</span>}
    </label>
  );
}
